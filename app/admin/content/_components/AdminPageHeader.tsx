"use client";

import { RefreshCw } from "lucide-react";
import AdminApiKeyCard from "./AdminApiKeyCard";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  draftKey: string;
  setDraftKey: (value: string) => void;
  hasKey: boolean;
  onSaveKey: () => void;
  onClearKey: () => void;
  focusInputSignal?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function AdminPageHeader({
  title,
  subtitle,
  draftKey,
  setDraftKey,
  hasKey,
  onSaveKey,
  onClearKey,
  focusInputSignal,
  onRefresh,
  refreshing = false,
}: AdminPageHeaderProps) {
  return (
    <div className="sticky top-2 z-20 mb-6 rounded-2xl border border-border/80 bg-gradient-to-br from-card/95 via-card/85 to-background/80 p-4 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
              aria-hidden="true"
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        ) : null}
      </div>

      <AdminApiKeyCard
        compact
        draftKey={draftKey}
        setDraftKey={setDraftKey}
        hasKey={hasKey}
        onSave={onSaveKey}
        onClear={onClearKey}
        focusInputSignal={focusInputSignal}
      />
    </div>
  );
}
