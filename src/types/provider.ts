/**
 * Provider abstraction types.
 * Business logic talks to these interfaces — never to KLIFGEN directly.
 */

import type { ModelId, AspectRatio } from "@/config/models";

export interface GenerationRequest {
  modelId: ModelId;
  variantKey: string;
  aspectRatio: AspectRatio;
  prompt: string;
  imageUrl?: string;
}

export interface GenerationResult {
  providerTaskId: string;
}

export type ProviderJobStatus = "pending" | "processing" | "completed" | "failed";

export interface JobStatusResult {
  providerTaskId: string;
  status: ProviderJobStatus;
  resultUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

export interface VideoProvider {
  generateVideo(request: GenerationRequest): Promise<GenerationResult>;
  getJobStatus(providerTaskId: string): Promise<JobStatusResult>;
}
