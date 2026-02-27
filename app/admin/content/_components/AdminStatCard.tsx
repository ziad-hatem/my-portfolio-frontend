"use client";

import { ReactNode } from "react";

interface AdminStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export default function AdminStatCard({
  title,
  value,
  subtitle,
  icon,
}: AdminStatCardProps) {
  return (
    <article className="rounded-2xl border border-border/80 bg-card/80 p-4 shadow-[0_6px_20px_-14px_rgba(0,0,0,0.7)] transition-all hover:border-accent/40 hover:shadow-[0_10px_28px_-18px_rgba(0,245,192,0.45)]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon ? (
          <div className="rounded-lg border border-border/70 bg-background/60 p-2 text-accent">
            {icon}
          </div>
        ) : null}
      </div>
      <p className="text-2xl font-semibold text-foreground mb-2">{value}</p>
      {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
    </article>
  );
}
