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
import { Loader2, CheckCircle2, X } from "lucide-react";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { MODELS } from "@/config/models";
import type { ModelId } from "@/config/models";
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
  const canceledParam = searchParams.get("canceled");

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

      {canceledParam && (
        <Alert variant="warning" title="Payment not completed">
          No charge was made. You can subscribe below whenever you&apos;re ready.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(["creator", "growth"] as const).map((planId) => {
              const plan = PLANS[planId];
              const meta = PLAN_META[planId];
              return (
                <div
                  key={planId}
                  className={`rounded-2xl border-2 p-6 bg-white ${
                    planId === "growth"
                      ? "border-brand-500 shadow-xl shadow-brand-100/40"
                      : "border-gray-200"
                  }`}
                >
                  {planId === "growth" && (
                    <span className="inline-block bg-brand-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3">
                      Most popular
                    </span>
                  )}

                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs font-medium text-brand-600 mt-0.5">{meta?.tagline}</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2">
                    €{plan.priceEur}
                    <span className="text-base font-normal text-gray-400">/mo</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{plan.description}</p>

                  <div className="mt-5 space-y-2.5">
                    <BillingFeature label={`${plan.monthlyUsageCredits.toLocaleString()} credits/month`} />
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{meta?.videos}</span>
                      <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                    </div>
                    {meta?.premiumNote && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{meta.premiumNote}</span>
                        <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                      </div>
                    )}
                    <BillingFeature label={`Max ${plan.maxResolutionTier === "premium" ? "1080p" : "720p"} resolution`} />
                    <BillingFeature label={`Up to ${plan.maxConcurrentJobs} concurrent jobs`} />
                    {plan.priorityQueue && <BillingFeature label="Priority queue" />}

                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-1">
                      Available models
                    </p>
                    {(Object.values(MODELS) as (typeof MODELS)[keyof typeof MODELS][]).map((m) => {
                      const included = plan.availableModels.includes(m.id as ModelId);
                      return (
                        <div key={m.id} className="flex items-center gap-2">
                          {included
                            ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            : <X className="h-4 w-4 text-gray-300 flex-shrink-0" />}
                          <span className={`text-sm ${included ? "text-gray-700" : "text-gray-400"}`}>
                            {m.displayName}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6">
                    <Button
                      fullWidth
                      variant={planId === "growth" ? "primary" : "secondary"}
                      onClick={() => handleSubscribe(planId)}
                      loading={checkoutLoading === planId}
                      size="lg"
                    >
                      Subscribe to {plan.name}
                    </Button>
                  </div>
                </div>
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

function BillingFeature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      <span className="text-sm text-gray-700">{label}</span>
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
