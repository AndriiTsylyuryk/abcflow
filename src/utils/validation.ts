/**
 * Validation helpers wrapping Zod.
 * Throw ValidationError with field-level details on parse failure.
 */

import { z } from "zod";
import { ValidationError } from "@/errors";

/**
 * Parse and validate a value against a Zod schema.
 * Throws ValidationError with field-level messages on failure.
 */
export function parseSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      fields[path || "_root"] = issue.message;
    }
    const firstMessage = result.error.issues[0]?.message ?? "Invalid input.";
    throw new ValidationError(firstMessage, fields);
  }

  return result.data;
}

// ── Reusable schema building blocks ──────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(80, "Name is too long.");

// ── Auth schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// ── Billing schemas ───────────────────────────────────────────────────────────

export const createCheckoutSchema = z.object({
  planId: z.enum(["creator", "growth"]),
  returnPath: z.string().max(200).optional(),
});

// ── Generation schemas ────────────────────────────────────────────────────────

export const createGenerationSchema = z.object({
  model: z.enum(["sora2", "grok_imagine", "seedance_lite", "veo3_fast"]),
  variantKey: z.string().trim().min(1, "Variant is required.").max(50),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]),
  prompt: z
    .string()
    .trim()
    .min(10, "Prompt must be at least 10 characters.")
    .max(5000, "Prompt must be under 5000 characters."),
  imageUrl: z.string().url("Image URL must be a valid URL.").optional(),
});

export const jobIdParamSchema = z.object({
  jobId: z
    .string()
    .trim()
    .min(1, "Job ID is required.")
    .max(128, "Invalid job ID."),
});
