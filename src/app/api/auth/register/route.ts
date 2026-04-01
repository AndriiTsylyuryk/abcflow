/**
 * POST /api/auth/register
 * Creates a new user account in Firebase Auth + Firestore.
 */

import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { createUserDocument } from "@/services/user.service";
import { successResponse, errorResponse } from "@/utils/api";
import { parseSchema, registerSchema } from "@/utils/validation";
import { ConflictError } from "@/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, displayName } = parseSchema(registerSchema, body);

    let uid: string;
    try {
      const userRecord = await getAdminAuth().createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
      uid = userRecord.uid;
    } catch (err: any) {
      console.error("[Register] Firebase createUser error:", err?.code, err?.message, err);
      if (err?.code === "auth/email-already-exists") {
        throw new ConflictError("An account with this email already exists.");
      }
      throw err;
    }

    await createUserDocument({ uid, email, displayName, authProvider: "password" });

    return successResponse({ uid, email, displayName }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
