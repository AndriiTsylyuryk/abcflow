/**
 * Application-wide constants.
 * Centralised so changes propagate everywhere automatically.
 */

export const APP_NAME = "ABCflow";
export const APP_TAGLINE = "AI Video Generation, Simplified.";

/** Firestore collection names */
export const COLLECTIONS = {
  USERS: "users",
  SUBSCRIPTIONS: "subscriptions",
  GENERATION_JOBS: "generationJobs",
  USAGE_TRANSACTIONS: "usageTransactions",
  WEBHOOK_EVENTS: "webhookEvents",
} as const;

/** Subscription statuses — kept in sync with Stripe */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
  PAUSED: "paused",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

/** Generation job statuses */
export const JOB_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];

/** Usage transaction types */
export const USAGE_TX_TYPE = {
  MONTHLY_RESET: "monthly_reset",
  GENERATION_DEBIT: "generation_debit",
  GENERATION_REFUND: "generation_refund",
  ADMIN_ADJUSTMENT: "admin_adjustment",
} as const;

export type UsageTxType = (typeof USAGE_TX_TYPE)[keyof typeof USAGE_TX_TYPE];

/** Polling settings for KLIFGEN job status checks */
export const POLLING = {
  /** How often to poll (ms) — KLIFGEN recommends 10–15s */
  INTERVAL_MS: 10_000,
  /** Max poll attempts before giving up (~10 min at 10s) */
  MAX_ATTEMPTS: 60,
  /** Timeout for a single HTTP request to provider (ms) */
  REQUEST_TIMEOUT_MS: 15_000,
} as const;

/** API response codes */
export const ERROR_CODES = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  BILLING_REQUIRED: "BILLING_REQUIRED",
  PLAN_INSUFFICIENT: "PLAN_INSUFFICIENT",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
