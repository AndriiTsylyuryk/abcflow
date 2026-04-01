"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth.context";
import { GenerationForm } from "@/components/generate/GenerationForm";
import { Alert } from "@/components/ui/Alert";
import { Loader2 } from "lucide-react";
import type { DashboardData } from "@/types/api";

export default function GeneratePage() {
  const { getIdToken } = useAuth();
  const [data, setData] = useState<Pick<DashboardData, "subscription" | "usage"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData({ subscription: json.data.subscription, usage: json.data.usage });
      } else {
        setError(json.error?.message ?? "Failed to load.");
      }
      setLoading(false);
    }
    load();
  }, [getIdToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !data) {
    return <Alert variant="error">{error ?? "Could not load your account data."}</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate a video</h1>
        <p className="text-sm text-gray-500 mt-1">
          Choose a model, write your prompt, and let AI do the rest.
        </p>
      </div>
      <GenerationForm
        currentPlan={data.subscription.plan}
        creditsRemaining={data.usage.creditsRemaining}
      />
    </div>
  );
}
