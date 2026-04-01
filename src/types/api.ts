/**
 * API request / response types shared between client and server.
 */

import type { ErrorCode } from "@/config/constants";
import type { PlanId } from "@/config/plans";
import type { ModelId, AspectRatio } from "@/config/models";
import type { JobStatus, SubscriptionStatus } from "@/config/constants";

// ── Generic API response envelope ────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    /** Field-level validation errors, if applicable */
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface CreateCheckoutRequest {
  planId: PlanId;
  returnPath?: string;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
}

export interface CreatePortalResponse {
  portalUrl: string;
}

// ── Generation ────────────────────────────────────────────────────────────────

export interface CreateGenerationRequest {
  model: ModelId;
  variantKey: string;
  aspectRatio: AspectRatio;
  prompt: string;
  imageUrl?: string;
}

export interface CreateGenerationResponse {
  jobId: string;
  status: JobStatus;
  usageCost: number;
  creditsRemaining: number;
}

export interface GenerationJobResponse {
  jobId: string;
  model: ModelId;
  variantKey: string;
  aspectRatio: AspectRatio;
  prompt: string;
  status: JobStatus;
  resultUrl: string | null;
  usageCost: number;
  requestedAt: string;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardData {
  user: {
    uid: string;
    email: string;
    displayName: string | null;
  };
  subscription: {
    status: SubscriptionStatus | "none";
    plan: PlanId | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    creditsRemaining: number;
    creditsMonthlyLimit: number;
    percentUsed: number;
  };
  recentJobs: GenerationJobResponse[];
}
