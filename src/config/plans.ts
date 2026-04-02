/**
 * Plan configuration — single source of truth for subscription plans.
 * All limits and entitlements are defined here, not scattered in code.
 */

export type PlanId = "creator" | "growth";
export type ResolutionTier = "standard" | "premium";
export type ModelId =
  | "sora2"
  | "grok_imagine"
  | "seedance_lite"
  | "veo3_fast"
  | "nano_banana_2"
  | "grok_imagine_image";

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  priceEur: number;
  stripePriceEnvKey: string;
  monthlyUsageCredits: number;
  availableModels: ModelId[];
  maxResolutionTier: ResolutionTier;
  priorityQueue: boolean;
  maxConcurrentJobs: number;
  maxGenerationsPerMinute: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  creator: {
    id: "creator",
    name: "Creator",
    description: "Perfect for individual creators getting started with AI video.",
    priceEur: 49,
    stripePriceEnvKey: "STRIPE_CREATOR_PRICE_ID",
    monthlyUsageCredits: 1500,
    availableModels: ["sora2", "grok_imagine", "seedance_lite", "nano_banana_2", "grok_imagine_image"],
    maxResolutionTier: "standard",
    priorityQueue: false,
    maxConcurrentJobs: 2,
    maxGenerationsPerMinute: 3,
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "For teams and power users who need more volume and quality.",
    priceEur: 89,
    stripePriceEnvKey: "STRIPE_GROWTH_PRICE_ID",
    monthlyUsageCredits: 4000,
    availableModels: ["sora2", "grok_imagine", "seedance_lite", "veo3_fast", "nano_banana_2", "grok_imagine_image"],
    maxResolutionTier: "premium",
    priorityQueue: true,
    maxConcurrentJobs: 5,
    maxGenerationsPerMinute: 8,
  },
};

/** Resolve a plan config safely — throws if unknown plan. */
export function getPlanConfig(planId: PlanId): PlanConfig {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  return plan;
}

/** Check whether a plan includes a given model. */
export function planIncludesModel(planId: PlanId, modelId: ModelId): boolean {
  return PLANS[planId]?.availableModels.includes(modelId) ?? false;
}
