/**
 * POST /api/webhooks/stripe
 * Handles all Stripe webhook events.
 *
 * Security:
 * - Signature verified with STRIPE_WEBHOOK_SECRET
 * - Events deduplicated via webhookEvents collection
 * - All handlers are idempotent
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import {
  handleCheckoutCompleted,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
} from "@/services/billing.service";
import {
  isWebhookEventProcessed,
  markWebhookEventPending,
  markWebhookEventDone,
} from "@/services/webhook.service";

export const runtime = "nodejs";

// Required: disable body parsing so we can verify the raw body signature
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);

  let event;
  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  // Idempotency check
  const alreadyProcessed = await isWebhookEventProcessed(event.id).catch(() => false);
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, skipped: true });
  }

  // Mark as pending before processing (prevents parallel processing)
  await markWebhookEventPending(event.id, event.type, "stripe").catch(() => {});

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          id: string;
          customer: string;
          subscription: string;
          metadata: Record<string, string>;
        };
        await handleCheckoutCompleted({
          sessionId: session.id,
          customerId: session.customer as string,
          subscriptionId: session.subscription as string,
          metadata: session.metadata ?? {},
        });
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        await handleSubscriptionUpdated(sub.id, {
          id: sub.id,
          customer: sub.customer,
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          metadata: sub.metadata ?? {},
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        await handleSubscriptionDeleted(sub.id, sub.customer);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentSucceeded({
          subscriptionId: invoice.subscription,
          customerId: invoice.customer,
          billingReason: invoice.billing_reason ?? null,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        await handleInvoicePaymentFailed({
          customerId: invoice.customer,
          subscriptionId: invoice.subscription,
        });
        break;
      }

      default:
        // Unhandled event type — not an error, just skip
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    await markWebhookEventDone(event.id).catch(() => {});
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`[Webhook] Error processing ${event.type}:`, err);
    // Return 200 to prevent Stripe retrying (we handle our own idempotency)
    return NextResponse.json(
      { received: true, error: "Processing error. Check server logs." },
      { status: 200 }
    );
  }
}
