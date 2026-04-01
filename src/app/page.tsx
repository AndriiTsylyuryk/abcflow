import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";
import { PLANS } from "@/config/plans";
import { MODELS } from "@/config/models";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Zap, Shield, Video } from "lucide-react";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { GradientHero } from "@/components/ui/GradientHero";

const PLAN_META: Record<string, { tagline: string; videos: string; premiumNote?: string }> = {
  creator: { tagline: "Best for getting started", videos: "~20–25 videos/month" },
  growth: { tagline: "Best for regular use & higher quality", videos: "~50–60 videos/month", premiumNote: "~20 premium (VEO) videos" },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <span className="text-xl font-bold text-brand-600">{APP_NAME}</span>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <GradientHero />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <Zap className="h-3 w-3" /> AI-powered video generation
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Create stunning AI videos <span className="text-brand-600">in seconds</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">{APP_TAGLINE}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Start generating</Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary">View pricing</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Models */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powered by the best AI models
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.values(MODELS) as (typeof MODELS)[keyof typeof MODELS][]).map((model) => (
              <div
                key={model.id}
                className="rounded-xl border border-gray-200 p-6 hover:border-brand-300 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-4">
                  <Video className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{model.displayName}</h3>
                <p className="text-sm text-gray-500">{model.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gray-600 mb-12">
            No credits to buy. No top-ups. Just a monthly subscription.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(Object.values(PLANS) as (typeof PLANS)[keyof typeof PLANS][]).map((plan) => (
              <div
                key={plan.id}
                className={`rounded-xl border-2 p-8 bg-white ${
                  plan.id === "growth"
                    ? "border-brand-500 shadow-lg shadow-brand-100"
                    : "border-gray-200"
                }`}
              >
                {plan.id === "growth" && (
                  <div className="inline-block bg-brand-600 text-white text-xs font-medium px-2 py-0.5 rounded-full mb-4">
                    Most popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs font-medium text-brand-600 mt-0.5">{PLAN_META[plan.id]?.tagline}</p>
                <p className="text-4xl font-bold text-gray-900 mt-3">
                  €{plan.priceEur}
                  <span className="text-base font-normal text-gray-500">/month</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {plan.monthlyUsageCredits.toLocaleString()} credits/month
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {PLAN_META[plan.id]?.videos}
                    <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                  </li>
                  {PLAN_META[plan.id]?.premiumNote && (
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {PLAN_META[plan.id].premiumNote}
                      <InfoTooltip text="Estimates based on average usage. Actual usage may vary." />
                    </li>
                  )}
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {plan.maxResolutionTier === "premium" ? "Up to 1080p" : "Up to 720p"}
                  </li>
                  {plan.priorityQueue && (
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Priority queue
                    </li>
                  )}
                </ul>
                <div className="mt-8">
                  <Link href="/register">
                    <Button
                      fullWidth
                      variant={plan.id === "growth" ? "primary" : "secondary"}
                    >
                      Get started
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {[
            { icon: Shield, title: "Secure by default", text: "All secrets server-side only. No leaks." },
            { icon: Zap, title: "Fast generation", text: "Your jobs queued and processed in seconds." },
            { icon: Video, title: "Multiple models", text: "Pick the best model for your use case." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title}>
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <span className="font-semibold text-brand-600">{APP_NAME}</span>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/terms" className="hover:text-gray-700">Terms &amp; Conditions</Link>
            <Link href="/pricing" className="hover:text-gray-700">Pricing</Link>
            <a href="mailto:andrii@abcflow.online" className="hover:text-gray-700">Support: andrii@abcflow.online</a>
          </div>
          <p>© {new Date().getFullYear()} ABCflow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
