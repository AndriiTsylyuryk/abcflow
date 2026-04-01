/**
 * Billing service — Stripe checkout, portal, and subscription management.
 */

import { getStripe } from "@/lib/stripe/client";
import { getAdminFirestore, admin } from "@/lib/firebase/admin";
import { COLLECTIONS, SUBSCRIPTION_STATUS } from "@/config/constants";
import { BillingError, DatabaseError, AuthorizationError } from "@/errors";
import { ERROR_CODES } from "@/config/constants";
import { PLANS } from "@/config/plans";
import type { PlanId } from "@/config/plans";
import type { SubscriptionDocument } from "@/types/database";
import {
  getUserDocument,
  updateUserBillingCustomerId,
  activateUserSubscription,
  deactivateUserSubscription,
  resetUserMonthlyCredits,
  findUserByBillingCustomerId,
} from "./user.service";
import { recordMonthlyReset } from "./usage.service";

function getStripePriceId(planId: PlanId): string {
  const envKey = PLANS[planId].stripePriceEnvKey;
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`Missing env var: ${envKey}. Configure your Stripe price IDs.`);
  }
  return priceId;
}

export async function createCheckoutSession(params: {
  uid: string;
  email: string | undefined;
  planId: PlanId;
  returnPath?: string;
}): Promise<string> {
  const stripe = getStripe();
  const user = await getUserDocument(params.uid);

  if (!user) {
    throw new AuthorizationError("User account not found.");
  }

  // Prevent duplicate active subscription
  if (
    user.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE ||
    user.subscriptionStatus === SUBSCRIPTION_STATUS.TRIALING
  ) {
    throw new BillingError(
      ERROR_CODES.CONFLICT,
      "You already have an active subscription. Use the billing portal to manage it."
    );
  }

  const priceId = getStripePriceId(params.planId);
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  let customerId = user.billingCustomerId ?? undefined;

  // Create or reuse Stripe customer
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: params.email ?? user.email,
      metadata: { uid: params.uid },
    });
    customerId = customer.id;
    await updateUserBillingCustomerId(params.uid, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId as string,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}${params.returnPath ?? "/billing"}?subscribed=1`,
    cancel_url: `${appUrl}/pricing?canceled=1`,
    metadata: {
      uid: params.uid,
      planId: params.planId,
    },
    subscription_data: {
      metadata: {
        uid: params.uid,
        planId: params.planId,
      },
    },
  });

  if (!session.url) {
    throw new BillingError(
      ERROR_CODES.INTERNAL_ERROR,
      "Failed to create checkout session."
    );
  }

  return session.url;
}

export async function createPortalSession(uid: string): Promise<string> {
  const stripe = getStripe();
  const user = await getUserDocument(uid);

  if (!user) {
    throw new AuthorizationError("User account not found.");
  }

  if (!user.billingCustomerId) {
    throw new BillingError(
      ERROR_CODES.BILLING_REQUIRED,
      "No billing account found. Please subscribe to a plan first."
    );
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: user.billingCustomerId,
    return_url: `${appUrl}/billing`,
  });

  return session.url;
}

/** Upsert subscription document in Firestore. */
async function upsertSubscription(
  subscriptionId: string,
  data: Partial<SubscriptionDocument> & { uid: string }
): Promise<void> {
  const db = getAdminFirestore();
  try {
    await db
      .collection(COLLECTIONS.SUBSCRIPTIONS)
      .doc(subscriptionId)
      .set(
        { ...data, updatedAt: admin.firestore.Timestamp.now() },
        { merge: true }
      );
  } catch (err) {
    throw new DatabaseError("Failed to upsert subscription.", err);
  }
}

// ── Webhook event handlers ────────────────────────────────────────────────────

export async function handleCheckoutCompleted(event: {
  sessionId: string;
  customerId: string;
  subscriptionId: string;
  metadata: Record<string, string>;
}): Promise<void> {
  const { uid, planId } = event.metadata;
  if (!uid || !planId) {
    console.error("[Webhook] checkout.session.completed missing metadata:", event.metadata);
    return;
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(event.subscriptionId);

  const now = admin.firestore.Timestamp.now();

  await upsertSubscription(event.subscriptionId, {
    uid,
    stripeCustomerId: event.customerId,
    stripeSubscriptionId: event.subscriptionId,
    plan: planId as PlanId,
    status: subscription.status as any,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_start * 1000
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_end * 1000
    ),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    createdAt: now,
  });

  await activateUserSubscription(uid, planId as PlanId, event.subscriptionId);

  console.log(`[Webhook] Activated subscription ${event.subscriptionId} for user ${uid}.`);
}

export async function handleSubscriptionUpdated(
  subscriptionId: string,
  rawSubscription: {
    id: string;
    customer: string;
    status: string;
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    metadata: Record<string, string>;
  }
): Promise<void> {
  const uid = rawSubscription.metadata?.uid;
  if (!uid) {
    // Try to find by customer ID
    const user = await findUserByBillingCustomerId(rawSubscription.customer as string);
    if (!user) {
      console.error("[Webhook] Cannot find user for subscription:", subscriptionId);
      return;
    }
  }

  const resolvedUid = uid || (await findUserByBillingCustomerId(rawSubscription.customer as string))?.uid;
  if (!resolvedUid) return;

  const planId = rawSubscription.metadata?.planId as PlanId | undefined;

  // Fetch subscription directly from Stripe to get authoritative period timestamps.
  // The webhook payload can send 0/null for these fields (e.g. on cancellation events).
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await upsertSubscription(subscriptionId, {
    uid: resolvedUid,
    stripeCustomerId: rawSubscription.customer as string,
    stripeSubscriptionId: subscriptionId,
    plan: planId!,
    status: subscription.status as any,
    currentPeriodStart: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_start * 1000
    ),
    currentPeriodEnd: admin.firestore.Timestamp.fromMillis(
      subscription.current_period_end * 1000
    ),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  // If subscription becomes inactive, reflect in user record
  const inactiveStatuses = [
    SUBSCRIPTION_STATUS.CANCELED,
    SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED,
    SUBSCRIPTION_STATUS.UNPAID,
  ];

  if (inactiveStatuses.includes(subscription.status as any)) {
    await deactivateUserSubscription(resolvedUid, subscription.status);
  }
}

export async function handleSubscriptionDeleted(
  subscriptionId: string,
  customerId: string
): Promise<void> {
  const user = await findUserByBillingCustomerId(customerId as string);
  if (!user) {
    console.error("[Webhook] handleSubscriptionDeleted: user not found for customer:", customerId);
    return;
  }

  const db = getAdminFirestore();
  await db.collection(COLLECTIONS.SUBSCRIPTIONS).doc(subscriptionId).update({
    status: SUBSCRIPTION_STATUS.CANCELED,
    updatedAt: admin.firestore.Timestamp.now(),
  }).catch(() => {});

  await deactivateUserSubscription(user.uid, SUBSCRIPTION_STATUS.CANCELED);
  console.log(`[Webhook] Subscription ${subscriptionId} canceled for user ${user.uid}.`);
}

export async function handleInvoicePaymentSucceeded(invoice: {
  subscriptionId: string;
  customerId: string;
  billingReason: string | null;
}): Promise<void> {
  // Only reset credits on subscription renewal, not initial payment
  if (invoice.billingReason !== "subscription_cycle") return;

  const user = await findUserByBillingCustomerId(invoice.customerId);
  if (!user) {
    console.error("[Webhook] invoice.payment_succeeded: user not found for customer:", invoice.customerId);
    return;
  }

  if (!user.currentPlan) {
    console.error("[Webhook] User has no plan during renewal:", user.uid);
    return;
  }

  const newBalance = await resetUserMonthlyCredits(user.uid, user.currentPlan);
  await recordMonthlyReset({
    uid: user.uid,
    newBalance,
    subscriptionId: invoice.subscriptionId,
  });

  console.log(`[Webhook] Reset credits for user ${user.uid} to ${newBalance}.`);
}

export async function handleInvoicePaymentFailed(invoice: {
  customerId: string;
  subscriptionId: string;
}): Promise<void> {
  const user = await findUserByBillingCustomerId(invoice.customerId);
  if (!user) return;

  await deactivateUserSubscription(user.uid, SUBSCRIPTION_STATUS.PAST_DUE);
  console.log(`[Webhook] Payment failed for user ${user.uid}. Status set to past_due.`);
}
