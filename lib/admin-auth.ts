import { NextRequest } from "next/server";

export interface AdminAuthResult {
  valid: boolean;
  error?: string;
  status?: number;
}

function readBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim() || null;
}

export function validateAdminApiKey(request: NextRequest): AdminAuthResult {
  const expectedApiKey = process.env.ADMIN_API_KEY;
  if (!expectedApiKey) {
    return {
      valid: false,
      error: "Server configuration error: ADMIN_API_KEY is not configured",
      status: 500,
    };
  }

  const providedApiKey = readBearerToken(request);
  if (!providedApiKey || providedApiKey !== expectedApiKey) {
    return {
      valid: false,
      error: "Unauthorized: Invalid or missing admin API key",
      status: 401,
    };
  }

  return { valid: true };
}

