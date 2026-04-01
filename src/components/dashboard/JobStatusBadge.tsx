import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { JobStatus } from "@/config/constants";

const statusConfig: Record<JobStatus, { label: string; variant: "success" | "warning" | "error" | "info" | "neutral" }> = {
  pending: { label: "Queued", variant: "neutral" },
  processing: { label: "Processing", variant: "info" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "error" },
  refunded: { label: "Refunded", variant: "warning" },
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = statusConfig[status] ?? { label: status, variant: "neutral" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
