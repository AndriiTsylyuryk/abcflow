/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session.
 */

import { NextRequest } from "next/server";
import { verifyAuthToken, successResponse, errorResponse } from "@/utils/api";
import { createPortalSession } from "@/services/billing.service";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyAuthToken(request);
    const portalUrl = await createPortalSession(uid);
    return successResponse({ portalUrl });
  } catch (err) {
    return errorResponse(err);
  }
}
