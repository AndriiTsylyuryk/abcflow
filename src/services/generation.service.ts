/**
 * Generation service — orchestrates the full video generation flow.
 *
 * Flow:
 * 1. Validate auth, subscription, plan access
 * 2. Check rate limits
 * 3. Create pending job
 * 4. Deduct credits atomically
 * 5. Call KLIFGEN
 * 6. Update job with provider task ID
 * 7. Return job info (polling is done separately)
 */

import { getAdminFirestore, admin } from "@/lib/firebase/admin";
import { COLLECTIONS, JOB_STATUS, SUBSCRIPTION_STATUS } from "@/config/constants";
import {
  AuthorizationError,
  BillingError,
  RateLimitError,
  ValidationError,
  DatabaseError,
  ProviderError,
} from "@/errors";
import { ERROR_CODES } from "@/config/constants";
import { getModelConfig, getModelVariant } from "@/config/models";
import { getPlanConfig, planIncludesModel } from "@/config/plans";
import { getUserDocument } from "./user.service";
import { deductCredits, refundCredits } from "./usage.service";
import { getVideoProvider } from "@/lib/klifgen/client";
import type { GenerationJobDocument } from "@/types/database";
import type { CreateGenerationRequest, CreateGenerationResponse, GenerationJobResponse } from "@/types/api";

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

/** Check per-minute rate limit for a user. */
async function checkRateLimit(uid: string, limitPerMinute: number): Promise<void> {
  const db = getAdminFirestore();
  const windowStart = admin.firestore.Timestamp.fromMillis(
    Date.now() - RATE_LIMIT_WINDOW_MS
  );

  // Fetch by uid only (no composite index needed), filter the window in JS.
  const snap = await db
    .collection(COLLECTIONS.GENERATION_JOBS)
    .where("uid", "==", uid)
    .get();

  const recentCount = snap.docs.filter((doc) => {
    const t = (doc.data() as GenerationJobDocument).requestedAt;
    return t && t >= windowStart;
  }).length;

  if (recentCount >= limitPerMinute) {
    throw new RateLimitError(
      `You can start at most ${limitPerMinute} generation(s) per minute. Please wait and try again.`
    );
  }
}

/** Check concurrent job limit for a user. */
async function checkConcurrentJobs(uid: string, maxConcurrent: number): Promise<void> {
  const db = getAdminFirestore();

  // Fetch by uid only (no composite index needed), filter status in JS.
  const snap = await db
    .collection(COLLECTIONS.GENERATION_JOBS)
    .where("uid", "==", uid)
    .get();

  const activeCount = snap.docs.filter((doc) => {
    const status = (doc.data() as GenerationJobDocument).status;
    return status === JOB_STATUS.PENDING || status === JOB_STATUS.PROCESSING;
  }).length;

  if (activeCount >= maxConcurrent) {
    throw new RateLimitError(
      `You already have ${maxConcurrent} active generation(s) in progress. Please wait for them to complete.`
    );
  }
}

export async function createGeneration(
  uid: string,
  request: CreateGenerationRequest
): Promise<CreateGenerationResponse> {
  // 1. Load user
  const user = await getUserDocument(uid);
  if (!user) {
    throw new AuthorizationError("User account not found.");
  }

  // 2. Check active subscription
  const activeStatuses: string[] = [
    SUBSCRIPTION_STATUS.ACTIVE,
    SUBSCRIPTION_STATUS.TRIALING,
  ];
  if (!user.subscriptionStatus || !activeStatuses.includes(user.subscriptionStatus)) {
    throw new BillingError(
      ERROR_CODES.BILLING_REQUIRED,
      "An active subscription is required to generate videos."
    );
  }

  if (!user.currentPlan) {
    throw new BillingError(
      ERROR_CODES.BILLING_REQUIRED,
      "No active plan found on your account."
    );
  }

  const planConfig = getPlanConfig(user.currentPlan);

  // 3. Check plan includes the requested model
  if (!planIncludesModel(user.currentPlan, request.model)) {
    throw new BillingError(
      ERROR_CODES.PLAN_INSUFFICIENT,
      `The ${request.model} model is not available on your current plan. Upgrade to access it.`
    );
  }

  // 4. Validate variant exists and check premium tier requirement
  const modelConfig = getModelConfig(request.model);
  const variant = getModelVariant(request.model, request.variantKey);

  if (variant.requiresPremiumTier && planConfig.maxResolutionTier !== "premium") {
    throw new BillingError(
      ERROR_CODES.PLAN_INSUFFICIENT,
      `This quality option requires the Growth plan.`
    );
  }

  // 5. Validate aspect ratio
  if (!modelConfig.supportedAspectRatios.includes(request.aspectRatio)) {
    throw new ValidationError(
      `${request.model} does not support ${request.aspectRatio} aspect ratio.`
    );
  }

  // 6. Credit cost from variant
  const cost = variant.creditCost;

  // 7. Check credits
  if (user.usageCreditsRemaining < cost) {
    throw new BillingError(
      ERROR_CODES.INSUFFICIENT_CREDITS,
      `Insufficient credits. This generation costs ${cost} credits, but you only have ${user.usageCreditsRemaining} remaining.`
    );
  }

  // 8. Rate limiting
  await checkRateLimit(uid, planConfig.maxGenerationsPerMinute);
  await checkConcurrentJobs(uid, planConfig.maxConcurrentJobs);

  // 9. Create pending job document
  const db = getAdminFirestore();
  const jobRef = db.collection(COLLECTIONS.GENERATION_JOBS).doc();
  const jobId = jobRef.id;
  const now = admin.firestore.Timestamp.now();

  const jobDoc: GenerationJobDocument = {
    uid,
    provider: "klifgen",
    model: request.model,
    prompt: request.prompt,
    imageUrl: request.imageUrl ?? null,
    variantKey: request.variantKey,
    aspectRatio: request.aspectRatio,
    requestedAt: now,
    status: JOB_STATUS.PENDING,
    providerTaskId: null,
    usageCost: cost,
    resultUrl: null,
    errorCode: null,
    errorMessage: null,
    completedAt: null,
  };

  try {
    await jobRef.set(jobDoc);
  } catch (err) {
    throw new DatabaseError("Failed to create generation job.", err);
  }

  // 10. Deduct credits atomically (BEFORE calling provider)
  let creditsRemaining: number;
  try {
    creditsRemaining = await deductCredits({ uid, amount: cost, jobId });
  } catch (err) {
    // Clean up job doc if credit deduction fails
    await jobRef.delete().catch(() => {});
    throw err;
  }

  // 11. Call KLIFGEN
  const provider = getVideoProvider();
  let providerTaskId: string;
  try {
    const result = await provider.generateVideo({
      modelId: request.model,
      variantKey: request.variantKey,
      aspectRatio: request.aspectRatio,
      prompt: request.prompt,
      imageUrl: request.imageUrl,
    });
    providerTaskId = result.providerTaskId;
  } catch (err) {
    // Provider call failed — refund credits immediately
    await refundCredits({ uid, amount: cost, jobId }).catch((refundErr) => {
      console.error("[Generation] Failed to refund credits after provider error:", refundErr);
    });

    // Mark job as failed
    await jobRef.update({
      status: JOB_STATUS.FAILED,
      errorCode: "PROVIDER_CALL_FAILED",
      errorMessage: err instanceof Error ? err.message : "Provider call failed.",
      completedAt: admin.firestore.Timestamp.now(),
    }).catch(() => {});

    throw new ProviderError(
      "The generation provider could not start your request. Your credits have been refunded."
    );
  }

  // 12. Save provider task ID and move to processing
  await jobRef.update({
    providerTaskId,
    status: JOB_STATUS.PROCESSING,
  }).catch((err) => {
    // Non-fatal — job is still running on provider side
    console.error("[Generation] Failed to update job with provider task ID:", err);
  });

  return {
    jobId,
    status: JOB_STATUS.PROCESSING,
    usageCost: cost,
    creditsRemaining,
  };
}

/** Poll for a single job's status from the provider and update Firestore. */
export async function pollJobStatus(jobId: string, uid: string): Promise<GenerationJobResponse> {
  const db = getAdminFirestore();
  const jobRef = db.collection(COLLECTIONS.GENERATION_JOBS).doc(jobId);

  const snap = await jobRef.get().catch((err) => {
    throw new DatabaseError("Failed to fetch job.", err);
  });

  if (!snap.exists) {
    throw new Error("Job not found.");
  }

  const job = snap.data() as GenerationJobDocument;

  // Security: ensure job belongs to requesting user
  if (job.uid !== uid) {
    throw new AuthorizationError("You do not have access to this job.");
  }

  // If already in terminal state, return current data
  if (
    job.status === JOB_STATUS.COMPLETED ||
    job.status === JOB_STATUS.FAILED ||
    job.status === JOB_STATUS.REFUNDED
  ) {
    return serializeJob(jobId, job);
  }

  // Fetch latest status from provider
  if (job.providerTaskId) {
    const provider = getVideoProvider();
    const statusResult = await provider.getJobStatus(job.providerTaskId).catch((err) => {
      console.error("[Polling] Provider status check failed:", err);
      return null;
    });

    if (statusResult) {
      const updates: Partial<GenerationJobDocument> = {
        status: mapProviderStatus(statusResult.status),
      };

      if (statusResult.status === "completed" && statusResult.resultUrl) {
        updates.resultUrl = statusResult.resultUrl;
        updates.completedAt = admin.firestore.Timestamp.now();
      }

      if (statusResult.status === "failed") {
        updates.errorCode = statusResult.errorCode;
        updates.errorMessage = statusResult.errorMessage;
        updates.completedAt = admin.firestore.Timestamp.now();

        // Refund credits on provider failure
        await refundCredits({ uid, amount: job.usageCost, jobId }).catch((err) => {
          console.error("[Polling] Failed to refund credits after job failure:", err);
        });
        updates.status = JOB_STATUS.REFUNDED;
      }

      await jobRef.update(updates).catch((err) => {
        console.error("[Polling] Failed to update job status:", err);
      });

      return serializeJob(jobId, { ...job, ...updates } as GenerationJobDocument);
    }
  }

  return serializeJob(jobId, job);
}

function mapProviderStatus(
  status: "pending" | "processing" | "completed" | "failed"
): typeof JOB_STATUS[keyof typeof JOB_STATUS] {
  switch (status) {
    case "pending": return JOB_STATUS.PENDING;
    case "processing": return JOB_STATUS.PROCESSING;
    case "completed": return JOB_STATUS.COMPLETED;
    case "failed": return JOB_STATUS.FAILED;
  }
}

function serializeJob(jobId: string, job: GenerationJobDocument): GenerationJobResponse {
  return {
    jobId,
    model: job.model,
    variantKey: job.variantKey,
    aspectRatio: job.aspectRatio,
    prompt: job.prompt,
    status: job.status,
    resultUrl: job.resultUrl,
    usageCost: job.usageCost,
    requestedAt: job.requestedAt.toDate().toISOString(),
    completedAt: job.completedAt?.toDate().toISOString() ?? null,
    errorCode: job.errorCode,
    errorMessage: job.errorMessage,
  };
}

export async function getUserJobs(
  uid: string,
  limit = 20
): Promise<GenerationJobResponse[]> {
  const db = getAdminFirestore();

  // No orderBy on a different field — avoids requiring a composite index.
  // Sort in JS after fetch instead.
  const snap = await db
    .collection(COLLECTIONS.GENERATION_JOBS)
    .where("uid", "==", uid)
    .limit(limit)
    .get()
    .catch((err) => {
      throw new DatabaseError("Failed to fetch generation jobs.", err);
    });

  return snap.docs
    .map((doc) => serializeJob(doc.id, doc.data() as GenerationJobDocument))
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}
