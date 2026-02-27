import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const convertBurstLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 5000,
  prefix: "portfolio:rate-limit:tools:image-to-pdf:convert:burst",
});

const convertHourlyLimiter = rateLimit({
  interval: 60 * 60 * 1000,
  uniqueTokenPerInterval: 8000,
  prefix: "portfolio:rate-limit:tools:image-to-pdf:convert:hourly",
});

const downloadLimiter = rateLimit({
  interval: 10 * 60 * 1000,
  uniqueTokenPerInterval: 8000,
  prefix: "portfolio:rate-limit:tools:image-to-pdf:download",
});

export interface RequestIdentity {
  ip: string;
  fingerprint: string | null;
}

export interface ConvertGuardAllowed {
  allowed: true;
  identity: RequestIdentity;
}

export interface ConvertGuardBlocked {
  allowed: false;
  status: 429;
  error: string;
  challengeRequired: boolean;
}

export type ConvertGuardResult = ConvertGuardAllowed | ConvertGuardBlocked;

export interface DownloadGuardResult {
  allowed: boolean;
  status?: 429;
  error?: string;
  identity: RequestIdentity;
}

function asPositiveInteger(input: string | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }

  const parsed = Number.parseInt(input, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getBurstLimit(): number {
  return asPositiveInteger(process.env.TOOLS_IMAGE_PDF_BURST_LIMIT, 8);
}

function getHourlyLimit(): number {
  return asPositiveInteger(process.env.TOOLS_IMAGE_PDF_HOURLY_LIMIT, 36);
}

function getDownloadLimit(): number {
  return asPositiveInteger(process.env.TOOLS_IMAGE_PDF_DOWNLOAD_LIMIT, 60);
}

function getRequesterIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIp) {
    return realIp.trim();
  }

  // @ts-expect-error Next adapters can expose request.ip depending on runtime.
  return request.ip || "anonymous";
}

function readFingerprintHeader(request: NextRequest): string | null {
  const raw = request.headers.get("x-client-fingerprint");
  if (!raw) {
    return null;
  }

  const value = raw.trim();
  if (!value) {
    return null;
  }

  return value.slice(0, 300);
}

export function resolveRequestIdentity(request: NextRequest): RequestIdentity {
  return {
    ip: getRequesterIp(request),
    fingerprint: readFingerprintHeader(request),
  };
}

function isRateLimitExceeded(error: unknown): boolean {
  return error instanceof Error && error.message === "Rate limit exceeded";
}

async function isLimited(identifier: string, limit: number, limiter: ReturnType<typeof rateLimit>) {
  try {
    await limiter.check(identifier, limit);
    return false;
  } catch (error) {
    if (isRateLimitExceeded(error)) {
      return true;
    }

    console.error("[ImageToPDF] Rate limiter backend failure:", error);
    return false;
  }
}

async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !token) {
    return false;
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { success?: unknown };
    return data.success === true;
  } catch (error) {
    console.error("[ImageToPDF] Turnstile verification failed:", error);
    return false;
  }
}

export async function enforceConvertAbuseGuard(
  request: NextRequest,
  turnstileToken: string | null
): Promise<ConvertGuardResult> {
  const identity = resolveRequestIdentity(request);
  const burstLimit = getBurstLimit();
  const hourlyLimit = getHourlyLimit();

  const burstIdentifiers = [`ip:${identity.ip}`];
  if (identity.fingerprint) {
    burstIdentifiers.push(`fp:${identity.fingerprint}`);
  }

  let burstLimited = false;
  for (const identifier of burstIdentifiers) {
    const limited = await isLimited(identifier, burstLimit, convertBurstLimiter);
    if (limited) {
      burstLimited = true;
    }
  }

  if (burstLimited) {
    const challengePassed =
      typeof turnstileToken === "string" &&
      turnstileToken.trim().length > 0 &&
      (await verifyTurnstileToken(turnstileToken.trim(), identity.ip));

    if (!challengePassed) {
      return {
        allowed: false,
        status: 429,
        error: "Challenge required",
        challengeRequired: true,
      };
    }
  }

  const hourlyIdentifiers = [`ip:${identity.ip}`];
  if (identity.fingerprint) {
    hourlyIdentifiers.push(`fp:${identity.fingerprint}`);
  }

  for (const identifier of hourlyIdentifiers) {
    const limited = await isLimited(identifier, hourlyLimit, convertHourlyLimiter);
    if (limited) {
      return {
        allowed: false,
        status: 429,
        error: "Rate limit exceeded",
        challengeRequired: false,
      };
    }
  }

  return {
    allowed: true,
    identity,
  };
}

export async function enforceShareDownloadGuard(
  request: NextRequest
): Promise<DownloadGuardResult> {
  const identity = resolveRequestIdentity(request);
  const limit = getDownloadLimit();
  const limited = await isLimited(`ip:${identity.ip}`, limit, downloadLimiter);

  if (limited) {
    return {
      allowed: false,
      status: 429,
      error: "Too many download attempts",
      identity,
    };
  }

  return {
    allowed: true,
    identity,
  };
}
