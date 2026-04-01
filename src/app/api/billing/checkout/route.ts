/**
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for the given plan.
 */

import { NextRequest } from "next/server";
import { verifyAuthToken, successResponse, errorResponse } from "@/utils/api";
import { parseSchema, createCheckoutSchema } from "@/utils/validation";
import { createCheckoutSession } from "@/services/billing.service";

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await verifyAuthToken(request);
    const body = await request.json().catch(() => ({}));
    const { planId, returnPath } = parseSchema(createCheckoutSchema, body);

    const checkoutUrl = await createCheckoutSession({ uid, email, planId, returnPath });

    return successResponse({ checkoutUrl });
  } catch (err) {
    return errorResponse(err);
  }
}
