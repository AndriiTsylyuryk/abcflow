/**
 * API response helpers — consistent envelope for all route handlers.
 */

import { NextResponse } from "next/server";
import { serializeError, getStatusCode } from "@/errors";
import type { ApiResponse } from "@/types/api";

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: unknown): NextResponse<ApiResponse<never>> {
  const serialized = serializeError(error);
  const status = getStatusCode(error);

  // Structured server log — never includes secrets or stack traces in prod
  if (process.env.NODE_ENV !== "production") {
    console.error("[API Error]", { code: serialized.code, error });
  } else {
    console.error("[API Error]", { code: serialized.code, message: serialized.message });
  }

  return NextResponse.json(
    { success: false, error: serialized },
    { status }
  );
}

/**
 * Verify Firebase ID token from Authorization header.
 * Returns uid on success, throws AuthenticationError on failure.
 */
import { getAdminAuth } from "@/lib/firebase/admin";
import { AuthenticationError } from "@/errors";

export async function verifyAuthToken(
  request: Request
): Promise<{ uid: string; email: string | undefined }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthenticationError("Missing or malformed Authorization header.");
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email };
  } catch (err) {
    throw new AuthenticationError("Invalid or expired token.", err);
  }
}
