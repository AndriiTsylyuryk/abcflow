"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PLANS } from "@/config/plans";
import { Loader2 } from "lucide-react";
import { InfoTooltip } from "@/components/ui/Tooltip";
import type { DashboardData } from "@/types/api";

const PLAN_META: Record<string, { tagline: string; videos: string; premiumNote?: string }> = {
  creator: { tagline: "Best for getting started", videos: "~20–25 videos/month" },
  growth: { tagline: "Best for regular use & higher quality", videos: "~50–60 videos/month", premiumNote: "~20 premium (VEO) videos" },
};

// Inner component uses useSearchParams — must be inside Suspense
function BillingContent() {
  const { getIdToken } = useAuth();
  const searchParams = useSearchParams();
  const successParam = searchParams.get("subscribed") ?? searchParams.get("success");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error?.message ?? "Failed to load billing.");
      setLoading(false);
    }
    load();
  }, [getIdToken]);

  async function handleSubscribe(planId: "creator" | "growth") {
    setCheckoutLoading(planId);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, returnPath: "/billing" }),
      });
      const json = await res.json();
      if (json.success) {
        window.location.href = json.data.checkoutUrl;
      } else {
        setError(json.error?.message ?? "Checkout failed.");
      }
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const token = await getIdToken();
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        window.location.href = json.data.portalUrl;
      } else {
        setError(json.error?.message ?? "Could not open billing portal.");
      }
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const subscription = data?.subscription;
  const hasActiveSub =
    subscription?.status === "active" || subscription?.status === "trialing";
  const planConfig = subscription?.plan ? PLANS[subscription.plan] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing &amp; account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription and payment details.
        </p>
      </div>

      {successParam && (
        <Alert variant="success" title="Subscription activated!">
          You&apos;re all set. Your credits have been added to your account.
        </Alert>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      {/* Current subscription */}
      {hasActiveSub && planConfig ? (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">
              Current plan
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">{planConfig.name}</span>
              <Badge variant={subscription?.status === "active" ? "success" : "warning"}>
                {subscription?.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>€{planConfig.priceEur}/month</span>
              {subscription?.currentPeriodEnd && (
                <span>
                  {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"}{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
            {subscription?.cancelAtPeriodEnd && (
              <Alert variant="warning">
                Your subscription will not renew. You can reactivate it from the billing portal.
              </Alert>
            )}
            <div className="pt-2">
              <p className="text-sm text-gray-500 mb-2">
                {data?.usage.creditsRemaining.toLocaleString()} /{" "}
                {data?.usage.creditsMonthlyLimit.toLocaleString()} credits remaining
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              onClick={handlePortal}
              loading={portalLoading}
            >
              Manage subscription
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* No active plan — show plan selector */
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-gray-900">
            Choose a plan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["creator", "growth"] as const).map((planId) => {
              const plan = PLANS[planId];
              return (
                <Card key={planId}>
                  <CardContent className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-xs font-medium text-brand-600">{PLAN_META[planId]?.tagline}</p>
                      <p className="text-2xl font-bold mt-1">
                        €{plan.priceEur}
                        <span className="text-sm font-normal text-gray-400">/mo</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1.5">
                      <li>✓ {plan.monthlyUsageCredits.toLocaleString()} credits/month</li>
                      <li className="flex items-center gap-1">
                        ✓ {PLAN_META[planId]?.videos}
                        <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                      </li>
                      {PLAN_META[planId]?.premiumNote && (
                        <li className="flex items-center gap-1">
                          ✓ {PLAN_META[planId].premiumNote}
                          <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                        </li>
                      )}
                      <li>✓ Max {plan.maxResolutionTier === "premium" ? "1080p" : "720p"}</li>
                      <li>✓ Up to {plan.maxConcurrentJobs} concurrent jobs</li>
                      {plan.priorityQueue && <li>✓ Priority queue</li>}
                    </ul>
                    <Button
                      fullWidth
                      variant={planId === "growth" ? "primary" : "secondary"}
                      onClick={() => handleSubscribe(planId)}
                      loading={checkoutLoading === planId}
                    >
                      Subscribe to {plan.name}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">
            Payments are securely processed by Stripe. Cancel anytime.
          </p>
        </div>
      )}

      {/* Account info */}
      {data && (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Account</h2>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{data.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-900">{data.user.displayName ?? "—"}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
