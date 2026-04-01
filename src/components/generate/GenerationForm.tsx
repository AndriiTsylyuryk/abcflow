"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { MODELS } from "@/config/models";
import { PLANS } from "@/config/plans";
import type { ModelId, AspectRatio } from "@/config/models";
import type { PlanId } from "@/config/plans";
import Link from "next/link";

interface GenerationFormProps {
  currentPlan: PlanId | null;
  creditsRemaining: number;
}

const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  "16:9": "16:9 Landscape",
  "9:16": "9:16 Portrait",
  "1:1": "1:1 Square",
};

export function GenerationForm({ currentPlan, creditsRemaining }: GenerationFormProps) {
  const { getIdToken } = useAuth();
  const router = useRouter();

  const availableModelIds = currentPlan ? PLANS[currentPlan].availableModels : [];

  const [model, setModel] = useState<ModelId>(availableModelIds[0] ?? "sora2");
  const [variantKey, setVariantKey] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modelConfig = MODELS[model];

  // Reset variant when model changes
  useEffect(() => {
    setVariantKey(modelConfig.defaultVariantKey);
    setAspectRatio(modelConfig.defaultAspectRatio);
  }, [model, modelConfig]);

  const selectedVariant = modelConfig.variants.find((v) => v.key === variantKey);
  const estimatedCost = selectedVariant?.creditCost ?? 0;
  const canAfford = creditsRemaining >= estimatedCost;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("Not authenticated.");

      const body: Record<string, string> = {
        model,
        variantKey,
        aspectRatio,
        prompt,
      };
      if (imageUrl.trim()) body.imageUrl = imageUrl.trim();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? "Generation failed.");

      router.push(`/dashboard?newJob=${data.data.jobId}`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!currentPlan) {
    return (
      <Alert variant="warning">
        You need an active subscription to generate videos.{" "}
        <Link href="/billing" className="font-medium underline">View plans →</Link>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">New generation</h2>
        <p className="text-sm text-gray-500 mt-1">
          {creditsRemaining.toLocaleString()} credits remaining this month
        </p>
      </CardHeader>
      <CardContent>
        {error && <Alert variant="error" className="mb-5">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Model selector */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.values(MODELS) as ModelConfig[]).map((m) => {
                const isAvailable = availableModelIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => isAvailable && setModel(m.id)}
                    disabled={!isAvailable}
                    title={!isAvailable ? "Upgrade to Growth to access this model" : m.description}
                    className={`relative p-3 rounded-lg border text-left transition-all text-xs ${
                      model === m.id && isAvailable
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : isAvailable
                        ? "border-gray-200 hover:border-gray-300 bg-white"
                        : "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <p className="font-semibold text-gray-900 truncate">{m.displayName}</p>
                    {!isAvailable && (
                      <span className="absolute top-1 right-1 text-[9px] bg-gray-200 text-gray-600 px-1 rounded">
                        Growth
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variant selector */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Quality / Duration</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {modelConfig.variants.map((v) => {
                const tierBlocked = v.requiresPremiumTier && currentPlan !== "growth";
                return (
                  <button
                    key={v.key}
                    type="button"
                    disabled={tierBlocked}
                    onClick={() => !tierBlocked && setVariantKey(v.key)}
                    title={tierBlocked ? "Requires Growth plan" : undefined}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      variantKey === v.key && !tierBlocked
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : tierBlocked
                        ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-900">{v.label}</p>
                    <p className="text-xs text-gray-400">{v.creditCost} credits</p>
                    {tierBlocked && (
                      <span className="text-[9px] text-orange-500 font-medium">Growth only</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect ratio */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Aspect ratio</label>
            <div className="flex gap-2 flex-wrap">
              {modelConfig.supportedAspectRatios.map((ar) => (
                <button
                  key={ar}
                  type="button"
                  onClick={() => setAspectRatio(ar)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    aspectRatio === ar
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {ASPECT_RATIO_LABELS[ar]}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the video you want to generate..."
              required
              minLength={10}
              maxLength={5000}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{prompt.length}/5000</p>
          </div>

          {/* Optional image URL */}
          {modelConfig.supportsImageInput && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Reference image URL{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/reference.jpg"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          {/* Cost preview */}
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-gray-600">Estimated cost</span>
            <span className={`text-sm font-semibold ${canAfford ? "text-gray-900" : "text-red-600"}`}>
              {estimatedCost} credits
              {!canAfford && (
                <span className="ml-2 text-red-500 font-normal text-xs">(insufficient)</span>
              )}
            </span>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={!canAfford || prompt.length < 10 || !variantKey}
          >
            Generate video
          </Button>

          {prompt.length > 0 && prompt.length < 10 && (
            <p className="text-xs text-center text-amber-600">
              Prompt must be at least 10 characters ({10 - prompt.length} more needed)
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

// Import needed for type annotation in JSX
import type { ModelConfig } from "@/config/models";
