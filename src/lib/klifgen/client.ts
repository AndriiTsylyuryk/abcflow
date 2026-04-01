/**
 * KLIFGEN provider client — server-side only.
 *
 * Auth: username + secret_key in request body (form-encoded) or query string.
 * Base URL: https://www.klifgen.app
 * Status: GET /query-status?username=...&secret_key=...&task_id=...
 */

import { getModelConfig, getModelVariant } from "@/config/models";
import { ProviderError } from "@/errors";
import { POLLING } from "@/config/constants";
import type {
  VideoProvider,
  GenerationRequest,
  GenerationResult,
  JobStatusResult,
  ProviderJobStatus,
} from "@/types/provider";

interface KlifgenGenerateResponse {
  success: boolean;
  task_id?: string;
  message?: string;
  credits_used?: number;
}

interface KlifgenStatusResponse {
  success: boolean;
  task_id: string;
  status: string;
  result_url?: string;
  image_url?: string;
  message?: string;
}

function getCredentials(): { username: string; secret_key: string } {
  const username = process.env.KLIFGEN_USERNAME;
  const secret_key = process.env.KLIFGEN_SECRET_KEY;
  if (!username || !secret_key) {
    throw new ProviderError("KLIFGEN credentials are not configured.");
  }
  return { username, secret_key };
}

function getBaseUrl(): string {
  return process.env.KLIFGEN_API_BASE_URL ?? "https://www.klifgen.app";
}

/** POST with form-encoded body */
async function klifgenPost<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const body = new URLSearchParams(params);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POLLING.REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    });
  } catch (err) {
    throw new ProviderError("Failed to reach the generation provider.", err);
  } finally {
    clearTimeout(timeout);
  }

  const data = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    const msg = (data as any)?.message ?? `HTTP ${response.status}`;
    throw new ProviderError(`Provider error: ${msg}`, { status: response.status });
  }

  return data;
}

/** GET with query string params */
async function klifgenGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const url = `${getBaseUrl()}${path}?${qs}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), POLLING.REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { method: "GET", signal: controller.signal });
  } catch (err) {
    throw new ProviderError("Failed to reach the generation provider.", err);
  } finally {
    clearTimeout(timeout);
  }

  const data = (await response.json().catch(() => ({}))) as T;

  if (!response.ok) {
    const msg = (data as any)?.message ?? `HTTP ${response.status}`;
    throw new ProviderError(`Provider status check error: ${msg}`, { status: response.status });
  }

  return data;
}

function mapProviderStatus(raw: string): ProviderJobStatus {
  switch (raw.toLowerCase()) {
    case "completed":
    case "succeeded":
      return "completed";
    case "failed":
    case "error":
      return "failed";
    case "processing":
    case "running":
      return "processing";
    default:
      return "processing";
  }
}

export class KlifgenProvider implements VideoProvider {
  async generateVideo(request: GenerationRequest): Promise<GenerationResult> {
    const { username, secret_key } = getCredentials();
    const modelConfig = getModelConfig(request.modelId);
    const variant = getModelVariant(request.modelId, request.variantKey);

    // Build params: credentials + runtime fields + variant-specific provider params
    const params: Record<string, string> = {
      username,
      secret_key,
      prompt: request.prompt,
      aspect_ratio: request.aspectRatio,
    };

    // Merge variant-specific params (n_frames, resolution, duration, model, etc.)
    for (const [k, v] of Object.entries(variant.providerParams)) {
      params[k] = String(v);
    }

    // Optional image input
    if (request.imageUrl) {
      params.has_image = "1";
      params.image_url = request.imageUrl;
    }

    const result = await klifgenPost<KlifgenGenerateResponse>(
      modelConfig.providerEndpoint,
      params
    );

    if (!result.success || !result.task_id) {
      throw new ProviderError(
        result.message ?? "Provider did not return a task ID."
      );
    }

    return { providerTaskId: result.task_id };
  }

  async getJobStatus(providerTaskId: string): Promise<JobStatusResult> {
    const { username, secret_key } = getCredentials();

    const result = await klifgenGet<KlifgenStatusResponse>("/query-status", {
      username,
      secret_key,
      task_id: providerTaskId,
    });

    // KLIFGEN uses result_url for videos, image_url for images
    const resultUrl = result.result_url ?? result.image_url ?? null;

    return {
      providerTaskId: result.task_id,
      status: mapProviderStatus(result.status),
      resultUrl,
      errorCode: result.success ? null : "PROVIDER_FAILED",
      errorMessage: result.success ? null : (result.message ?? null),
    };
  }
}

let providerInstance: VideoProvider | null = null;

export function getVideoProvider(): VideoProvider {
  if (!providerInstance) {
    providerInstance = new KlifgenProvider();
  }
  return providerInstance;
}
