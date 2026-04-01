/**
 * User service — manages Firestore user documents.
 */

import { getAdminFirestore, admin } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/config/constants";
import { DatabaseError } from "@/errors";
import type { UserDocument } from "@/types/database";
import type { PlanId } from "@/config/plans";
import { getPlanConfig } from "@/config/plans";

export async function createUserDocument(params: {
  uid: string;
  email: string;
  displayName: string | null;
  authProvider: "password" | "google";
}): Promise<void> {
  const db = getAdminFirestore();
  const now = admin.firestore.Timestamp.now();

  const userDoc: UserDocument = {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName,
    createdAt: now,
    updatedAt: now,
    authProvider: params.authProvider,
    subscriptionStatus: "none",
    currentPlan: null,
    usageCreditsRemaining: 0,
    usageCreditsMonthlyLimit: 0,
    billingCustomerId: null,
    activeSubscriptionId: null,
  };

  try {
    await db
      .collection(COLLECTIONS.USERS)
      .doc(params.uid)
      .set(userDoc, { merge: false });
  } catch (err) {
    throw new DatabaseError("Failed to create user record.", err);
  }
}

export async function getUserDocument(uid: string): Promise<UserDocument | null> {
  const db = getAdminFirestore();
  try {
    const snap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!snap.exists) return null;
    return snap.data() as UserDocument;
  } catch (err) {
    throw new DatabaseError("Failed to fetch user record.", err);
  }
}

export async function updateUserBillingCustomerId(
  uid: string,
  billingCustomerId: string
): Promise<void> {
  const db = getAdminFirestore();
  try {
    await db
      .collection(COLLECTIONS.USERS)
      .doc(uid)
      .update({
        billingCustomerId,
        updatedAt: admin.firestore.Timestamp.now(),
      });
  } catch (err) {
    throw new DatabaseError("Failed to update billing customer.", err);
  }
}

export async function activateUserSubscription(
  uid: string,
  plan: PlanId,
  subscriptionId: string
): Promise<void> {
  const db = getAdminFirestore();
  const planConfig = getPlanConfig(plan);
  const now = admin.firestore.Timestamp.now();

  try {
    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      subscriptionStatus: "active",
      currentPlan: plan,
      activeSubscriptionId: subscriptionId,
      usageCreditsMonthlyLimit: planConfig.monthlyUsageCredits,
      usageCreditsRemaining: planConfig.monthlyUsageCredits,
      updatedAt: now,
    });
  } catch (err) {
    throw new DatabaseError("Failed to activate user subscription.", err);
  }
}

export async function resetUserMonthlyCredits(
  uid: string,
  plan: PlanId
): Promise<number> {
  const db = getAdminFirestore();
  const planConfig = getPlanConfig(plan);
  const now = admin.firestore.Timestamp.now();
  const newLimit = planConfig.monthlyUsageCredits;

  try {
    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      usageCreditsRemaining: newLimit,
      usageCreditsMonthlyLimit: newLimit,
      updatedAt: now,
    });
    return newLimit;
  } catch (err) {
    throw new DatabaseError("Failed to reset monthly credits.", err);
  }
}

export async function deactivateUserSubscription(
  uid: string,
  status: string
): Promise<void> {
  const db = getAdminFirestore();
  try {
    await db.collection(COLLECTIONS.USERS).doc(uid).update({
      subscriptionStatus: status,
      updatedAt: admin.firestore.Timestamp.now(),
    });
  } catch (err) {
    throw new DatabaseError("Failed to deactivate subscription.", err);
  }
}

export async function findUserByBillingCustomerId(
  billingCustomerId: string
): Promise<UserDocument | null> {
  const db = getAdminFirestore();
  try {
    const snap = await db
      .collection(COLLECTIONS.USERS)
      .where("billingCustomerId", "==", billingCustomerId)
      .limit(1)
      .get();

    if (snap.empty) return null;
    return snap.docs[0]!.data() as UserDocument;
  } catch (err) {
    throw new DatabaseError("Failed to find user by billing customer.", err);
  }
}
