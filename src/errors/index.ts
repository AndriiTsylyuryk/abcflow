/**
 * Typed error hierarchy for ABCflow.
 *
 * All errors carry:
 *  - code: stable machine-readable string
 *  - message: human-readable (safe for clients)
 *  - statusCode: HTTP status to return
 *  - cause: optional underlying error (server-only, never forwarded to client)
 */

import type { ErrorCode } from "@/config/constants";
import { ERROR_CODES } from "@/config/constants";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly cause?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    cause?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required.", cause?: unknown) {
    super(ERROR_CODES.UNAUTHENTICATED, message, 401, cause);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to do this.", cause?: unknown) {
    super(ERROR_CODES.UNAUTHORIZED, message, 403, cause);
    this.name = "AuthorizationError";
  }
}

export class ValidationError extends AppError {
  readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>, cause?: unknown) {
    super(ERROR_CODES.VALIDATION_ERROR, message, 422, cause);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down.", cause?: unknown) {
    super(ERROR_CODES.RATE_LIMITED, message, 429, cause);
    this.name = "RateLimitError";
  }
}

export class BillingError extends AppError {
  constructor(code: ErrorCode, message: string, cause?: unknown) {
    const status =
      code === ERROR_CODES.BILLING_REQUIRED ||
      code === ERROR_CODES.PLAN_INSUFFICIENT ||
      code === ERROR_CODES.INSUFFICIENT_CREDITS
        ? 402
        : 400;
    super(code, message, status, cause);
    this.name = "BillingError";
  }
}

export class ProviderError extends AppError {
  constructor(message = "The video generation provider returned an error.", cause?: unknown) {
    super(ERROR_CODES.PROVIDER_ERROR, message, 502, cause);
    this.name = "ProviderError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred.", cause?: unknown) {
    super(ERROR_CODES.DATABASE_ERROR, message, 503, cause);
    this.name = "DatabaseError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.", cause?: unknown) {
    super(ERROR_CODES.NOT_FOUND, message, 404, cause);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(ERROR_CODES.CONFLICT, message, 409, cause);
    this.name = "ConflictError";
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred.", cause?: unknown) {
    super(ERROR_CODES.INTERNAL_ERROR, message, 500, cause);
    this.name = "InternalServerError";
  }
}

/**
 * Safely serialize an error for the API response.
 * Never leaks stack traces or internal details in production.
 */
export function serializeError(error: unknown): {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
} {
  if (error instanceof ValidationError) {
    return { code: error.code, message: error.message, fields: error.fields };
  }
  if (error instanceof AppError) {
    return { code: error.code, message: error.message };
  }

  // Unknown errors — never leak details
  const isDev = process.env.NODE_ENV !== "production";
  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: isDev && error instanceof Error
      ? error.message
      : "An unexpected error occurred. Please try again.",
  };
}

/** Extract HTTP status code from any error. */
export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) return error.statusCode;
  return 500;
}
