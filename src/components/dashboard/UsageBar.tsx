"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface UsageBarProps {
  creditsRemaining: number;
  creditsMonthlyLimit: number;
  percentUsed: number;
}

export function UsageBar({
  creditsRemaining,
  creditsMonthlyLimit,
  percentUsed,
}: UsageBarProps) {
  const color =
    percentUsed >= 90
      ? "bg-red-500"
      : percentUsed >= 70
      ? "bg-yellow-500"
      : "bg-brand-500";

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">Monthly usage</span>
        <span className="text-sm font-medium text-gray-900">
          {creditsRemaining.toLocaleString()} /{" "}
          {creditsMonthlyLimit.toLocaleString()} credits
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
          role="progressbar"
          aria-valuenow={percentUsed}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {percentUsed >= 90 && (
        <p className="mt-1 text-xs text-red-600">
          You&apos;re almost out of credits for this month.
        </p>
      )}
    </div>
  );
}
