/**
 * GET /api/jobs/[jobId]
 * Returns the current status of a generation job.
 * Also polls the provider for status if the job is still in progress.
 */

import { NextRequest } from "next/server";
import { verifyAuthToken, successResponse, errorResponse } from "@/utils/api";
import { parseSchema, jobIdParamSchema } from "@/utils/validation";
import { pollJobStatus } from "@/services/generation.service";
import { NotFoundError } from "@/errors";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { uid } = await verifyAuthToken(request);
    const { jobId } = parseSchema(jobIdParamSchema, params);

    const job = await pollJobStatus(jobId, uid).catch((err) => {
      if (err?.message === "Job not found.") throw new NotFoundError("Job not found.");
      throw err;
    });

    return successResponse(job);
  } catch (err) {
    return errorResponse(err);
  }
}
