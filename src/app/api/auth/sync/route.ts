/**
 * POST /api/auth/sync
 *
 * Called after OAuth sign-in (e.g. Google) to ensure a Firestore user
 * document exists. Safe to call multiple times — uses merge so it won't
 * overwrite existing data.
 */

import { NextRequest } from "next/server";
import { verifyAuthToken, successResponse, errorResponse } from "@/utils/api";
import { getAdminFirestore, admin } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/config/constants";
import type { UserDocument } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await verifyAuthToken(request);

    const db = getAdminFirestore();
    const ref = db.collection(COLLECTIONS.USERS).doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      // First OAuth sign-in — create the document
      const adminUser = await (await import("@/lib/firebase/admin"))
        .getAdminAuth()
        .getUser(uid);

      const doc: UserDocument = {
        uid,
        email: email ?? adminUser.email ?? "",
        displayName: adminUser.displayName ?? null,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        authProvider: "google",
        subscriptionStatus: "none",
        currentPlan: null,
        usageCreditsRemaining: 0,
        usageCreditsMonthlyLimit: 0,
        billingCustomerId: null,
        activeSubscriptionId: null,
      };

      await ref.set(doc);
    }

    return successResponse({ synced: true });
  } catch (err) {
    return errorResponse(err);
  }
}
