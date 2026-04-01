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
import { Loader2, Video, Plus, ArrowRight } from "lucide-react";
import type { ModelId } from "@/config/models";

// Inner component uses useSearchParams — must be inside Suspense
function DashboardContent() {
  const { getIdToken } = useAuth();
  const searchParams = useSearchParams();
  const newJobId = searchParams.get("newJob");

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

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Auto-refresh when a new job was just started
  useEffect(() => {
    if (!newJobId) return;
    const interval = setInterval(fetchDashboard, 5000);
    return () => clearInterval(interval);
  }, [newJobId, fetchDashboard]);

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
          <Link href="/pricing" className="font-medium underline">
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
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">
                    Prompt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden md:table-cell">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">
                    Started
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {MODELS[job.model as ModelId]?.displayName ?? job.model}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell max-w-xs">
                      <span className="truncate block">{job.prompt}</span>
                    </td>
                    <td className="px-4 py-3">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {job.usageCost} credits
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {formatDistanceToNow(new Date(job.requestedAt), {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {job.resultUrl && (
                        <a
                          href={job.resultUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                        >
                          View →
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
