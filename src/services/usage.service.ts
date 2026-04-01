/**
 * Usage accounting service.
 *
 * All credit mutations go through Firestore transactions to ensure atomicity.
 * Every change is recorded in usageTransactions for a complete audit trail.
 */

import { getAdminFirestore, admin } from "@/lib/firebase/admin";
import { COLLECTIONS, USAGE_TX_TYPE } from "@/config/constants";
import { DatabaseError, BillingError } from "@/errors";
import { ERROR_CODES } from "@/config/constants";
import type { UsageTransactionDocument } from "@/types/database";

/**
 * Atomically deduct credits from a user's balance.
 * Returns the new balance after deduction.
 * Throws BillingError if insufficient credits.
 */
export async function deductCredits(params: {
  uid: string;
  amount: number;
  jobId: string;
}): Promise<number> {
  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.USERS).doc(params.uid);
  const txRef = db.collection(COLLECTIONS.USAGE_TRANSACTIONS).doc();

  try {
    const balanceAfter = await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new DatabaseError("User not found during credit deduction.");
      }

      const data = userSnap.data()!;
      const current: number = data.usageCreditsRemaining ?? 0;

      if (current < params.amount) {
        throw new BillingError(
          ERROR_CODES.INSUFFICIENT_CREDITS,
          `Insufficient credits. Need ${params.amount}, have ${current}.`
        );
      }

      const newBalance = current - params.amount;

      tx.update(userRef, {
        usageCreditsRemaining: newBalance,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      const txDoc: UsageTransactionDocument = {
        uid: params.uid,
        type: USAGE_TX_TYPE.GENERATION_DEBIT,
        amount: -params.amount,
        balanceAfter: newBalance,
        relatedJobId: params.jobId,
        relatedSubscriptionId: null,
        createdAt: admin.firestore.Timestamp.now(),
      };
      tx.set(txRef, txDoc);

      return newBalance;
    });

    return balanceAfter;
  } catch (err) {
    // Re-throw our own errors as-is
    if (err instanceof BillingError || err instanceof DatabaseError) throw err;
    throw new DatabaseError("Failed to deduct usage credits.", err);
  }
}

/**
 * Refund credits back to a user's balance (e.g. when provider job fails).
 */
export async function refundCredits(params: {
  uid: string;
  amount: number;
  jobId: string;
}): Promise<number> {
  const db = getAdminFirestore();
  const userRef = db.collection(COLLECTIONS.USERS).doc(params.uid);
  const txRef = db.collection(COLLECTIONS.USAGE_TRANSACTIONS).doc();

  try {
    const balanceAfter = await db.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        throw new DatabaseError("User not found during credit refund.");
      }

      const data = userSnap.data()!;
      const current: number = data.usageCreditsRemaining ?? 0;
      const monthlyLimit: number = data.usageCreditsMonthlyLimit ?? 0;

      // Never refund above the monthly limit
      const newBalance = Math.min(current + params.amount, monthlyLimit);

      tx.update(userRef, {
        usageCreditsRemaining: newBalance,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      const txDoc: UsageTransactionDocument = {
        uid: params.uid,
        type: USAGE_TX_TYPE.GENERATION_REFUND,
        amount: params.amount,
        balanceAfter: newBalance,
        relatedJobId: params.jobId,
        relatedSubscriptionId: null,
        createdAt: admin.firestore.Timestamp.now(),
      };
      tx.set(txRef, txDoc);

      return newBalance;
    });

    return balanceAfter;
  } catch (err) {
    if (err instanceof DatabaseError) throw err;
    throw new DatabaseError("Failed to refund usage credits.", err);
  }
}

/**
 * Record a monthly reset transaction (called from webhook on subscription renewal).
 */
export async function recordMonthlyReset(params: {
  uid: string;
  newBalance: number;
  subscriptionId: string;
}): Promise<void> {
  const db = getAdminFirestore();
  const txDoc: UsageTransactionDocument = {
    uid: params.uid,
    type: USAGE_TX_TYPE.MONTHLY_RESET,
    amount: params.newBalance,
    balanceAfter: params.newBalance,
    relatedJobId: null,
    relatedSubscriptionId: params.subscriptionId,
    createdAt: admin.firestore.Timestamp.now(),
  };

  try {
    await db.collection(COLLECTIONS.USAGE_TRANSACTIONS).add(txDoc);
  } catch (err) {
    throw new DatabaseError("Failed to record monthly reset transaction.", err);
  }
}
