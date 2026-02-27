"use client";

import { ReactNode } from "react";

interface AdminEmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export default function AdminEmptyState({
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/60 px-4 py-8 text-center">
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {action ? <div className="flex justify-center">{action}</div> : null}
    </div>
  );
}
