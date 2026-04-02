import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/config/constants";
import { PLANS } from "@/config/plans";
import { MODELS } from "@/config/models";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Zap, Shield, Video } from "lucide-react";
import { InfoTooltip } from "@/components/ui/Tooltip";
import { GradientHero } from "@/components/ui/GradientHero";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://abcflow.online";

const PLAN_META: Record<string, { tagline: string; videos: string; premiumNote?: string }> = {
  creator: { tagline: "Best for getting started", videos: "~20–25 videos · 50+ images/month" },
  growth: { tagline: "Best for regular use & higher quality", videos: "~50–60 videos · 150+ images/month", premiumNote: "~20 premium (VEO 3.1) videos" },
};

const FAQ_ITEMS = [
  {
    question: "What is an AI video generator?",
    answer:
      "An AI video generator uses artificial intelligence to create videos from text descriptions (prompts). Instead of filming or editing footage manually, you describe what you want and the AI produces the video automatically — in seconds.",
  },
  {
    question: "How does text-to-video AI work?",
    answer:
      "Text-to-video models are trained on large datasets of video and text pairs. When you enter a prompt, the model interprets your description and generates video frames that match it, outputting a complete clip ready to download.",
  },
  {
    question: "Which AI models does ABCflow support?",
    answer:
      "ABCflow supports Sora 2 (OpenAI), Veo 3 Fast (Google DeepMind), Seedance Lite (ByteDance), and Grok Imagine (xAI). Each model has different strengths in quality, speed, and resolution — up to 1080p on the Growth plan.",
  },
  {
    question: "Is ABCflow suitable for marketing and social media videos?",
    answer:
      "Yes. ABCflow supports 16:9, 9:16, and 1:1 aspect ratios, making it perfect for YouTube, Instagram Reels, TikTok, and LinkedIn. Create promotional clips, product demos, and social content in seconds without any editing software.",
  },
  {
    question: "Do I need a subscription to use ABCflow?",
    answer:
      "Yes. ABCflow uses a simple monthly subscription model — no per-video credits to buy, no top-ups. The Creator plan starts at a low monthly price and includes everything you need to get started with AI video generation.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${APP_URL}/#organization`,
      name: "ABCflow",
      url: APP_URL,
      logo: {
        "@type": "ImageObject",
        url: `${APP_URL}/favicon.svg`,
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "andrii@abcflow.online",
        contactType: "customer support",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "ABCflow",
      publisher: { "@id": `${APP_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${APP_URL}/generate?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Powered by the best AI models
          </h2>
          <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
            Access the world&apos;s leading text-to-video AI models through one simple subscription — no separate API keys required.
          </p>
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

      {/* What is ABCflow */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            What is ABCflow AI Video Generator?
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            ABCflow is an online AI video generator that turns text prompts into high-quality videos in seconds. Powered by the world&apos;s most advanced AI models — including OpenAI&apos;s Sora 2, Google&apos;s Veo 3, ByteDance&apos;s Seedance, and xAI&apos;s Grok Imagine — ABCflow makes professional AI video creation accessible to everyone.
          </p>
          <p className="text-gray-500 text-base leading-relaxed">
            Whether you need videos for social media, marketing campaigns, product demos, or creative projects, ABCflow lets you generate them instantly — no video editing skills required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            How to create AI videos from text
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Three simple steps to generate your first AI video
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Write your prompt",
                description:
                  "Describe the video you want in plain English. Include scene details, style, mood, and any specific elements you need.",
              },
              {
                step: "2",
                title: "Choose your AI model",
                description:
                  "Select from Sora 2, Veo 3, Seedance Lite, or Grok Imagine. Each model offers different resolutions, durations, and visual styles.",
              },
              {
                step: "3",
                title: "Download your video",
                description:
                  "Your AI-generated video is ready in seconds. Watch it directly in the dashboard and download it in full quality.",
              },
            ].map(({ step, title, description }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white text-lg font-bold flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/register">
              <Button size="lg">Create your first AI video</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Frequently asked questions
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Everything you need to know about AI video generation with ABCflow
          </p>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
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
