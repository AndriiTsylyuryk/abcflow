/**
 * Stripe server-side client — server-side only.
 * NEVER import this in client components.
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Cannot initialise Stripe."
    );
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-04-10",
    typescript: true,
  });

  return stripeInstance;
}
