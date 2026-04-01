/**
 * POST /api/generate
 * Starts a new video generation job.
 */

import { NextRequest } from "next/server";
import { verifyAuthToken, successResponse, errorResponse } from "@/utils/api";
import { parseSchema, createGenerationSchema } from "@/utils/validation";
import { createGeneration } from "@/services/generation.service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await verifyAuthToken(request);
    const body = await request.json().catch(() => ({}));
    const validatedBody = parseSchema(createGenerationSchema, body);

    const result = await createGeneration(uid, validatedBody);

    return successResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
