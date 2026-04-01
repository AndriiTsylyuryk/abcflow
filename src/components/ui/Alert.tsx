import React from "react";
import { cn } from "@/utils/cn";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const configs: Record<
  AlertVariant,
  { icon: React.FC<{ className?: string }>; styles: string }
> = {
  success: { icon: CheckCircle2, styles: "bg-green-50 border-green-200 text-green-800" },
  error: { icon: XCircle, styles: "bg-red-50 border-red-200 text-red-800" },
  warning: { icon: AlertCircle, styles: "bg-yellow-50 border-yellow-200 text-yellow-800" },
  info: { icon: Info, styles: "bg-blue-50 border-blue-200 text-blue-800" },
};

export function Alert({ variant = "info", title, children, className }: AlertProps) {
  const { icon: Icon, styles } = configs[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-sm",
        styles,
        className
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
