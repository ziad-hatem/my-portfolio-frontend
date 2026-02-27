"use client";

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  unauthorized?: boolean;
  [key: string]: unknown;
}

function extractError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as { error?: unknown };
  return typeof candidate.error === "string" ? candidate.error : null;
}

export async function adminApiRequest<T = unknown>(
  apiKey: string,
  path: string,
  init: RequestInit = {}
): Promise<ApiEnvelope<T>> {
  if (!apiKey.trim()) {
    return {
      success: false,
      error: "Admin API key is required",
      status: 401,
      unauthorized: true,
    };
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    return {
      success: false,
      error:
        extractError(payload) || `Request failed with status ${response.status}`,
      status: response.status,
      unauthorized: response.status === 401,
    };
  }

  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (!envelope.success) {
      return {
        success: false,
        error: envelope.error || "Request failed",
        status: response.status,
        unauthorized: response.status === 401,
      };
    }

    return {
      ...envelope,
      status: response.status,
      unauthorized: response.status === 401,
    };
  }

  return {
    success: true,
    data: payload as T,
    status: response.status,
    unauthorized: false,
  };
}

function toJsonBody(body: unknown): string {
  return JSON.stringify(body ?? {});
}

export function adminGet<T = unknown>(apiKey: string, path: string) {
  return adminApiRequest<T>(apiKey, path, {
    method: "GET",
  });
}

export function adminPost<T = unknown>(
  apiKey: string,
  path: string,
  body: unknown
) {
  return adminApiRequest<T>(apiKey, path, {
    method: "POST",
    body: toJsonBody(body),
  });
}

export function adminPut<T = unknown>(
  apiKey: string,
  path: string,
  body: unknown
) {
  return adminApiRequest<T>(apiKey, path, {
    method: "PUT",
    body: toJsonBody(body),
  });
}

export function adminDelete<T = unknown>(apiKey: string, path: string) {
  return adminApiRequest<T>(apiKey, path, {
    method: "DELETE",
  });
}
