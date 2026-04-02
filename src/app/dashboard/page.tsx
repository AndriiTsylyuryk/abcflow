"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { UsageBar } from "@/components/dashboard/UsageBar";
import { JobStatusBadge } from "@/components/dashboard/JobStatusBadge";
import { PLANS } from "@/config/plans";
import { MODELS } from "@/config/models";
import { formatDistanceToNow } from "date-fns";
import type { DashboardData } from "@/types/api";
import { Loader2, Video, Plus, ArrowRight, Download } from "lucide-react";
import type { ModelId } from "@/config/models";

// Inner component uses useSearchParams — must be inside Suspense
function DashboardContent() {
  const { getIdToken } = useAuth();
  const searchParams = useSearchParams();
  searchParams.get("newJob"); // keeps Suspense boundary needed for useSearchParams

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;

    const res = await fetch("/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) {
      setData(json.data);
    } else {
      setError(json.error?.message ?? "Failed to load dashboard.");
    }
    setLoading(false);
  }, [getIdToken]);

  // Poll each in-progress job against KLIFGEN, then refresh dashboard data
  const pollActiveJobs = useCallback(async () => {
    const token = await getIdToken();
    if (!token || !data) return;

    const activeJobs = data.recentJobs.filter(
      (j) => j.status === "pending" || j.status === "processing"
    );
    if (activeJobs.length === 0) return;

    await Promise.all(
      activeJobs.map((j) =>
        fetch(`/api/jobs/${j.jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null)
      )
    );

    // Reload dashboard to reflect updated statuses from Firestore
    await fetchDashboard();
  }, [getIdToken, data, fetchDashboard]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Poll active jobs every 10s whenever any are in progress
  useEffect(() => {
    const hasActive = data?.recentJobs.some(
      (j) => j.status === "pending" || j.status === "processing"
    );
    if (!hasActive) return;

    const interval = setInterval(pollActiveJobs, 10_000);
    return () => clearInterval(interval);
  }, [data, pollActiveJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !data) {
    return <Alert variant="error">{error ?? "Failed to load dashboard."}</Alert>;
  }

  const { subscription, usage, recentJobs } = data;
  const planConfig = subscription.plan ? PLANS[subscription.plan] : null;
  const hasActiveSub =
    subscription.status === "active" || subscription.status === "trialing";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{data.user.displayName ? `, ${data.user.displayName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s your generation overview.
          </p>
        </div>
        {hasActiveSub && (
          <Link href="/generate">
            <Button>
              <Plus className="h-4 w-4" />
              New generation
            </Button>
          </Link>
        )}
      </div>

      {/* Subscription CTA if no plan */}
      {!hasActiveSub && (
        <Alert variant="warning" title="No active subscription">
          Subscribe to a plan to start generating videos.{" "}
          <Link href="/billing" className="font-medium underline">
            View plans →
          </Link>
        </Alert>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Plan</p>
            <p className="text-lg font-semibold text-gray-900">
              {planConfig?.name ?? "—"}
            </p>
            {subscription.status !== "none" && (
              <Badge
                variant={
                  hasActiveSub ? "success" : subscription.status === "past_due" ? "warning" : "error"
                }
                className="mt-1"
              >
                {subscription.status}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Credits remaining
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {usage.creditsRemaining.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              of {usage.creditsMonthlyLimit.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Renews
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : "—"}
            </p>
            {subscription.cancelAtPeriodEnd && (
              <p className="text-xs text-orange-600">Cancels at period end</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage bar */}
      {hasActiveSub && (
        <Card>
          <CardContent>
            <UsageBar
              creditsRemaining={usage.creditsRemaining}
              creditsMonthlyLimit={usage.creditsMonthlyLimit}
              percentUsed={usage.percentUsed}
            />
          </CardContent>
        </Card>
      )}

      {/* Available models */}
      {planConfig && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Your available models
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {planConfig.availableModels.map((modelId) => {
              const m = MODELS[modelId as ModelId];
              return (
                <div
                  key={modelId}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <p className="text-sm font-medium text-gray-900">{m.displayName}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{m.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Recent generations
          </h2>
          {recentJobs.length > 0 && (
            <Link
              href="/generate"
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              New generation <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No generations yet.</p>
              {hasActiveSub && (
                <Link href="/generate" className="mt-3 inline-block">
                  <Button size="sm">Create your first video</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentJobs.map((job) => (
              <div
                key={job.jobId}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
              >
                {/* Media / placeholder area */}
                <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                  {job.resultUrl ? (
                    MODELS[job.model as ModelId]?.outputType === "image" ? (
                      <img
                        src={job.resultUrl}
                        alt={job.prompt}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <video
                        src={job.resultUrl}
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    )
                  ) : job.status === "failed" || job.status === "refunded" ? (
                    <div className="text-center px-4">
                      <p className="text-red-400 text-xs font-medium">Generation failed</p>
                      <p className="text-gray-500 text-xs mt-1">Credits refunded</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs">Processing…</p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-gray-700 line-clamp-2 flex-1">{job.prompt}</p>
                    <JobStatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{MODELS[job.model as ModelId]?.displayName ?? job.model} · {job.usageCost} credits</span>
                    <span>{formatDistanceToNow(new Date(job.requestedAt), { addSuffix: true })}</span>
                  </div>
                  {job.resultUrl && (
                    <a
                      href={job.resultUrl}
                      download
                      className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
