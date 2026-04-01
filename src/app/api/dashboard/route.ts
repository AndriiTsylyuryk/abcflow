/**
 * GET /api/dashboard
 * Returns all data needed for the dashboard page in a single request.
 */

import { NextRequest } from "next/server";
import { verifyAuthToken, successResponse, errorResponse } from "@/utils/api";
import { getUserDocument } from "@/services/user.service";
import { getUserJobs } from "@/services/generation.service";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/config/constants";
import { AuthorizationError } from "@/errors";
import type { SubscriptionDocument } from "@/types/database";
import type { DashboardData } from "@/types/api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { uid, email } = await verifyAuthToken(request);

    const [user, recentJobs] = await Promise.all([
      getUserDocument(uid),
      getUserJobs(uid, 10),
    ]);

    if (!user) throw new AuthorizationError("User account not found.");

    // Fetch subscription details if available
    let subscriptionData: DashboardData["subscription"] = {
      status: user.subscriptionStatus ?? "none",
      plan: user.currentPlan,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    if (user.activeSubscriptionId) {
      const db = getAdminFirestore();
      const subSnap = await db
        .collection(COLLECTIONS.SUBSCRIPTIONS)
        .doc(user.activeSubscriptionId)
        .get();

      if (subSnap.exists) {
        const sub = subSnap.data() as SubscriptionDocument;
        subscriptionData = {
          status: sub.status,
          plan: sub.plan,
          currentPeriodEnd: sub.currentPeriodEnd.toDate().toISOString(),
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        };
      }
    }

    const creditsRemaining = user.usageCreditsRemaining ?? 0;
    const creditsLimit = user.usageCreditsMonthlyLimit ?? 0;
    const percentUsed =
      creditsLimit > 0
        ? Math.round(((creditsLimit - creditsRemaining) / creditsLimit) * 100)
        : 0;

    const dashboardData: DashboardData = {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
      subscription: subscriptionData,
      usage: {
        creditsRemaining,
        creditsMonthlyLimit: creditsLimit,
        percentUsed,
      },
      recentJobs,
    };

    return successResponse(dashboardData);
  } catch (err) {
    return errorResponse(err);
  }
}
