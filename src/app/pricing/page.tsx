import Link from "next/link";
import type { Metadata } from "next";
import { APP_NAME } from "@/config/constants";
import { MODELS } from "@/config/models";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, X } from "lucide-react";
import { InfoTooltip } from "@/components/ui/Tooltip";

export const metadata: Metadata = { title: "Pricing" };

const PLAN_MARKETING = {
  creator: {
    tagline: "Best for getting started",
    videoEstimate: "~20–25 videos/month",
    premiumNote: null,
  },
  growth: {
    tagline: "Best for regular use & higher quality",
    videoEstimate: "~50–60 videos/month",
    premiumNote: "~20 premium (VEO) videos",
  },
} as const;

const PLANS_DISPLAY = [
  {
    id: "creator" as const,
    name: "Creator",
    priceEur: 49,
    description: "Perfect for individual creators getting started with AI video.",
    monthlyUsageCredits: 1500,
    maxConcurrentJobs: 2,
    maxResolutionTier: "standard" as const,
    priorityQueue: false,
    availableModels: ["sora2", "grok_imagine", "seedance_lite"] as string[],
  },
  {
    id: "growth" as const,
    name: "Growth",
    priceEur: 89,
    description: "For teams and power users who need more volume and quality.",
    monthlyUsageCredits: 4000,
    maxConcurrentJobs: 5,
    maxResolutionTier: "premium" as const,
    priorityQueue: true,
    availableModels: ["sora2", "grok_imagine", "seedance_lite", "veo3_fast"] as string[],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-brand-600">
            {APP_NAME}
          </Link>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto py-20 px-4">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transparent, simple pricing
          </h1>
          <p className="text-lg text-gray-600">
            No credits to top up. No surprise charges. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {PLANS_DISPLAY.map((plan) => {
            const marketing = PLAN_MARKETING[plan.id];
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-8 ${
                  plan.id === "growth"
                    ? "border-brand-500 shadow-xl shadow-brand-100/40"
                    : "border-gray-200"
                }`}
              >
                {plan.id === "growth" && (
                  <span className="inline-block bg-brand-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mb-4">
                    Most popular
                  </span>
                )}

                <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                <p className="text-xs font-medium text-brand-600 mt-0.5">{marketing.tagline}</p>

                <p className="mt-3 text-4xl font-extrabold text-gray-900">
                  €{plan.priceEur}
                  <span className="text-lg font-normal text-gray-400">/mo</span>
                </p>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>

                <div className="mt-8 space-y-3">
                  <Feature label={`${plan.monthlyUsageCredits.toLocaleString()} usage credits/month`} />

                  {/* Video estimate with tooltip */}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{marketing.videoEstimate}</span>
                    <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                  </div>

                  {marketing.premiumNote && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{marketing.premiumNote}</span>
                      <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                    </div>
                  )}

                  <Feature label={`Up to ${plan.maxConcurrentJobs} concurrent jobs`} />
                  <Feature label={`Max ${plan.maxResolutionTier === "premium" ? "1080p" : "720p"} resolution`} />
                  {plan.priorityQueue && <Feature label="Priority queue" />}

                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                    Available models
                  </p>
                  {(Object.values(MODELS) as (typeof MODELS)[keyof typeof MODELS][]).map((m) => {
                    const included = plan.availableModels.includes(m.id);
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        {included ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${included ? "text-gray-700" : "text-gray-400"}`}>
                          {m.displayName}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <Link href="/register">
                    <Button
                      fullWidth
                      variant={plan.id === "growth" ? "primary" : "secondary"}
                      size="lg"
                    >
                      Start with {plan.name}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          Credits reset every billing period. No rollover.{" "}
          <Link href="/login" className="text-brand-600 hover:underline">
            Already have an account? Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
