/**
 * Firestore document types.
 * These match the database schema exactly.
 */

import type { Timestamp } from "firebase-admin/firestore";
import type { PlanId } from "@/config/plans";
import type { ModelId, AspectRatio } from "@/config/models";
import type {
  SubscriptionStatus,
  JobStatus,
  UsageTxType,
} from "@/config/constants";

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authProvider: "password" | "google";
  subscriptionStatus: SubscriptionStatus | "none";
  currentPlan: PlanId | null;
  usageCreditsRemaining: number;
  usageCreditsMonthlyLimit: number;
  billingCustomerId: string | null;
  activeSubscriptionId: string | null;
}

export interface SubscriptionDocument {
  uid: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GenerationJobDocument {
  uid: string;
  provider: "klifgen";
  model: ModelId;
  prompt: string;
  imageUrl: string | null;
  variantKey: string;
  aspectRatio: AspectRatio;
  requestedAt: Timestamp;
  status: JobStatus;
  providerTaskId: string | null;
  usageCost: number;
  resultUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  completedAt: Timestamp | null;
}

export interface UsageTransactionDocument {
  uid: string;
  type: UsageTxType;
  amount: number;
  balanceAfter: number;
  relatedJobId: string | null;
  relatedSubscriptionId: string | null;
  createdAt: Timestamp;
}

export interface WebhookEventDocument {
  provider: "stripe";
  processed: boolean;
  processedAt: Timestamp | null;
  type: string;
  createdAt: Timestamp;
}
