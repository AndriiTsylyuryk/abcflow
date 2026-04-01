/**
 * Model configuration — maps internal model IDs to KLIFGEN endpoints
 * and defines internal usage credit costs per generation variant.
 *
 * Internal credits use a 3× markup over KLIFGEN provider credits.
 * This decouples our billing from provider costs.
 *
 * Credit costs are based on the KLIFGEN API documentation.
 */

import type { ResolutionTier, ModelId } from "./plans";

export type { ModelId } from "./plans";
export type AspectRatio = "16:9" | "9:16" | "1:1";

/**
 * A specific generation option for a model (e.g. "720p · 10s").
 * providerParams contains exactly what gets sent to KLIFGEN alongside
 * the runtime fields (prompt, aspect_ratio, image_url).
 */
export interface ModelVariant {
  key: string;
  label: string;
  /** Internal credits charged to the user */
  creditCost: number;
  /** If true, requires Growth plan (premium tier) */
  requiresPremiumTier: boolean;
  /** Params sent verbatim to the KLIFGEN endpoint */
  providerParams: Record<string, string | number>;
}

export interface ModelConfig {
  id: ModelId;
  displayName: string;
  description: string;
  provider: "klifgen";
  /** KLIFGEN endpoint path, e.g. /request-sora-2 */
  providerEndpoint: string;
  variants: ModelVariant[];
  defaultVariantKey: string;
  supportedAspectRatios: AspectRatio[];
  defaultAspectRatio: AspectRatio;
  supportsImageInput: boolean;
  maxResolutionTier: ResolutionTier;
}

// ── Internal credit multiplier ────────────────────────────────────────────────
// 1 KLIFGEN credit = MARKUP internal credits
const MARKUP = 3;
const c = (klifgenCredits: number) => klifgenCredits * MARKUP;

// ── Model definitions ─────────────────────────────────────────────────────────

export const MODELS: Record<ModelId, ModelConfig> = {
  sora2: {
    id: "sora2",
    displayName: "Sora 2",
    description: "OpenAI's Sora 2 — high-quality cinematic video generation.",
    provider: "klifgen",
    providerEndpoint: "/request-sora-2",
    supportsImageInput: true,
    maxResolutionTier: "standard",
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    defaultAspectRatio: "16:9",
    defaultVariantKey: "10s",
    variants: [
      {
        key: "10s",
        label: "~10 seconds",
        creditCost: c(25), // 75
        requiresPremiumTier: false,
        providerParams: { n_frames: 10 },
      },
      {
        key: "15s",
        label: "~15 seconds",
        creditCost: c(35), // 105
        requiresPremiumTier: false,
        providerParams: { n_frames: 15 },
      },
    ],
  },

  grok_imagine: {
    id: "grok_imagine",
    displayName: "Grok Imagine",
    description: "xAI's Grok Imagine — fast video generation at 480p or 720p.",
    provider: "klifgen",
    providerEndpoint: "/request-grok-imagine",
    supportsImageInput: true,
    maxResolutionTier: "standard",
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    defaultAspectRatio: "16:9",
    defaultVariantKey: "480p_6s",
    variants: [
      {
        key: "480p_6s",
        label: "480p · 6s",
        creditCost: c(10), // 30
        requiresPremiumTier: false,
        providerParams: { resolution: "480p", duration: "6" },
      },
      {
        key: "480p_10s",
        label: "480p · 10s",
        creditCost: c(20), // 60
        requiresPremiumTier: false,
        providerParams: { resolution: "480p", duration: "10" },
      },
      {
        key: "720p_6s",
        label: "720p · 6s",
        creditCost: c(20), // 60
        requiresPremiumTier: false,
        providerParams: { resolution: "720p", duration: "6" },
      },
      {
        key: "720p_10s",
        label: "720p · 10s",
        creditCost: c(30), // 90
        requiresPremiumTier: false,
        providerParams: { resolution: "720p", duration: "10" },
      },
    ],
  },

  seedance_lite: {
    id: "seedance_lite",
    displayName: "Seedance Lite",
    description: "ByteDance Seedance Lite — efficient video generation up to 1080p.",
    provider: "klifgen",
    providerEndpoint: "/request-seedance",
    supportsImageInput: true,
    maxResolutionTier: "premium",
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    defaultAspectRatio: "16:9",
    defaultVariantKey: "720p_5s",
    variants: [
      {
        key: "480p_5s",
        label: "480p · 5s",
        creditCost: c(15), // 45
        requiresPremiumTier: false,
        providerParams: { model: "lite", resolution: "480p", duration: "5" },
      },
      {
        key: "720p_5s",
        label: "720p · 5s",
        creditCost: c(25), // 75
        requiresPremiumTier: false,
        providerParams: { model: "lite", resolution: "720p", duration: "5" },
      },
      {
        key: "720p_10s",
        label: "720p · 10s",
        creditCost: c(45), // 135
        requiresPremiumTier: false,
        providerParams: { model: "lite", resolution: "720p", duration: "10" },
      },
      {
        key: "1080p_5s",
        label: "1080p · 5s",
        creditCost: c(45), // 135
        requiresPremiumTier: true,
        providerParams: { model: "lite", resolution: "1080p", duration: "5" },
      },
      {
        key: "1080p_10s",
        label: "1080p · 10s",
        creditCost: c(80), // 240
        requiresPremiumTier: true,
        providerParams: { model: "lite", resolution: "1080p", duration: "10" },
      },
    ],
  },

  veo3_fast: {
    id: "veo3_fast",
    displayName: "Veo 3 Fast",
    description: "Google's Veo 3 in fast mode — premium quality, ~8 second videos.",
    provider: "klifgen",
    providerEndpoint: "/request-veo3",
    supportsImageInput: true,
    maxResolutionTier: "premium",
    supportedAspectRatios: ["16:9", "9:16", "1:1"],
    defaultAspectRatio: "16:9",
    defaultVariantKey: "standard",
    variants: [
      {
        key: "standard",
        label: "~8 seconds",
        creditCost: c(60), // 180
        requiresPremiumTier: true,
        providerParams: { model: "veo3_fast" },
      },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getModelConfig(modelId: ModelId): ModelConfig {
  const model = MODELS[modelId];
  if (!model) throw new Error(`Unknown model: ${modelId}`);
  return model;
}

export function getModelVariant(modelId: ModelId, variantKey: string): ModelVariant {
  const model = getModelConfig(modelId);
  const variant = model.variants.find((v) => v.key === variantKey);
  if (!variant) throw new Error(`Unknown variant "${variantKey}" for model "${modelId}"`);
  return variant;
}
