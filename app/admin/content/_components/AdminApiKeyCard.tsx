"use client";

import { useEffect, useRef } from "react";
import { KeyRound } from "lucide-react";

interface AdminApiKeyCardProps {
  draftKey: string;
  setDraftKey: (value: string) => void;
  hasKey: boolean;
  onSave: () => void;
  onClear: () => void;
  compact?: boolean;
  focusInputSignal?: number;
}

export default function AdminApiKeyCard({
  draftKey,
  setDraftKey,
  hasKey,
  onSave,
  onClear,
  compact = false,
  focusInputSignal,
}: AdminApiKeyCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusInputSignal === undefined) {
      return;
    }

    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusInputSignal]);

  if (compact) {
    return (
      <div className="rounded-xl border border-border/80 bg-background/70 px-3 py-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <KeyRound size={13} aria-hidden="true" />
          <span>
            Admin key status: {hasKey ? "Active for this session" : "Missing"}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            ref={inputRef}
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="Enter ADMIN_API_KEY"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-accent text-accent-foreground px-3 py-2 text-sm font-medium"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-card/80 p-4">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Admin Session Key</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Stored only in this browser session and sent as
            <code> Authorization: Bearer &lt;key&gt;</code>.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            ref={inputRef}
            type="password"
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder="Enter ADMIN_API_KEY"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={onSave}
            className="rounded-md bg-accent text-accent-foreground px-4 py-2 text-sm font-medium"
          >
            Save Key
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-border px-4 py-2 text-sm"
          >
            Clear
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Status: {hasKey ? "Active for this session" : "No key set"}
        </p>
      </div>
    </section>
  );
}
