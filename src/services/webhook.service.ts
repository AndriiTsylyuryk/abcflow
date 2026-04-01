/**
 * Webhook processing service.
 * Stores processed event IDs to ensure idempotency.
 */

import { getAdminFirestore, admin } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/config/constants";
import type { WebhookEventDocument } from "@/types/database";

/**
 * Check if a webhook event has already been processed.
 * Returns true if already processed (should skip).
 */
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.WEBHOOK_EVENTS).doc(eventId).get();
  if (!snap.exists) return false;
  return (snap.data() as WebhookEventDocument).processed === true;
}

/** Mark a webhook event as being processed (write before processing to prevent races). */
export async function markWebhookEventPending(
  eventId: string,
  eventType: string,
  provider: "stripe"
): Promise<void> {
  const db = getAdminFirestore();
  const doc: WebhookEventDocument = {
    provider,
    type: eventType,
    processed: false,
    processedAt: null,
    createdAt: admin.firestore.Timestamp.now(),
  };
  await db.collection(COLLECTIONS.WEBHOOK_EVENTS).doc(eventId).set(doc);
}

/** Mark a webhook event as successfully processed. */
export async function markWebhookEventDone(eventId: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection(COLLECTIONS.WEBHOOK_EVENTS).doc(eventId).update({
    processed: true,
    processedAt: admin.firestore.Timestamp.now(),
  });
}
