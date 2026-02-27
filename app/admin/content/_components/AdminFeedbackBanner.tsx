"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type FeedbackVariant = "success" | "error" | "warning" | "info";

interface AdminFeedbackBannerProps {
  variant: FeedbackVariant;
  message: string;
  className?: string;
}

function variantStyles(variant: FeedbackVariant): string {
  switch (variant) {
    case "success":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "error":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "warning":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    default:
      return "border-sky-400/30 bg-sky-500/10 text-sky-200";
  }
}

function FeedbackIcon({ variant }: { variant: FeedbackVariant }) {
  if (variant === "success") {
    return <CheckCircle2 size={16} aria-hidden="true" />;
  }

  if (variant === "error") {
    return <AlertCircle size={16} aria-hidden="true" />;
  }

  if (variant === "warning") {
    return <AlertTriangle size={16} aria-hidden="true" />;
  }

  return <Info size={16} aria-hidden="true" />;
}

export default function AdminFeedbackBanner({
  variant,
  message,
  className,
}: AdminFeedbackBannerProps) {
  return (
    <div
      className={[
        "rounded-lg border px-3 py-2 text-sm flex items-start gap-2",
        variantStyles(variant),
        className || "",
      ].join(" ")}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <FeedbackIcon variant={variant} />
      <p>{message}</p>
    </div>
  );
}
