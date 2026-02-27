"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const ADMIN_API_KEY_STORAGE = "portfolio_admin_api_key";

function readSessionKey(): string {
  try {
    return window.sessionStorage.getItem(ADMIN_API_KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

function writeSessionKey(value: string): void {
  try {
    if (value) {
      window.sessionStorage.setItem(ADMIN_API_KEY_STORAGE, value);
      return;
    }

    window.sessionStorage.removeItem(ADMIN_API_KEY_STORAGE);
  } catch {
    // Ignore storage errors and continue with in-memory state.
  }
}

export function useAdminApiKey() {
  const [apiKey, setApiKey] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readSessionKey();
    setApiKey(stored);
    setDraftKey(stored);
    setReady(true);
  }, []);

  const saveKey = useCallback(() => {
    const next = draftKey.trim();
    setApiKey(next);
    writeSessionKey(next);
  }, [draftKey]);

  const clearKey = useCallback(() => {
    setApiKey("");
    setDraftKey("");
    writeSessionKey("");
  }, []);

  const hasKey = useMemo(() => apiKey.trim().length > 0, [apiKey]);

  return {
    ready,
    apiKey,
    draftKey,
    setDraftKey,
    saveKey,
    clearKey,
    hasKey,
  };
}
