import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_VERSION = "v1";

export interface ShareTokenPayload {
  assetId: string;
  exp: number;
  nonce: string;
}

export interface SignedShareTokenResult {
  token: string;
  tokenHash: string;
  payload: ShareTokenPayload;
}

export interface VerifyShareTokenResult {
  valid: boolean;
  payload?: ShareTokenPayload;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function getShareTokenSecret(): string {
  return getRequiredEnv("TOOLS_SHARE_TOKEN_SECRET");
}

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payloadBase64: string): string {
  const secret = getShareTokenSecret();
  return createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function buildTokenHash(token: string): string {
  const secret = getShareTokenSecret();
  return createHash("sha256")
    .update(`share-token:${secret}:${token}`)
    .digest("hex");
}

export function hashShareToken(token: string): string {
  return buildTokenHash(token);
}

export function hashIdentifierForStorage(identifier: string): string {
  const secret = getShareTokenSecret();
  return createHash("sha256")
    .update(`identifier:${secret}:${identifier.trim().toLowerCase()}`)
    .digest("hex");
}

export function createSignedShareToken(
  assetId: string,
  expiresAt: Date
): SignedShareTokenResult {
  const payload: ShareTokenPayload = {
    assetId,
    exp: Math.floor(expiresAt.getTime() / 1000),
    nonce: randomBytes(18).toString("base64url"),
  };

  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signatureBase64 = signPayload(payloadBase64);
  const token = `${TOKEN_VERSION}.${payloadBase64}.${signatureBase64}`;

  return {
    token,
    tokenHash: buildTokenHash(token),
    payload,
  };
}

export function verifySignedShareToken(token: string): VerifyShareTokenResult {
  if (!token) {
    return { valid: false };
  }

  const [version, payloadBase64, signatureBase64] = token.split(".");
  if (!version || !payloadBase64 || !signatureBase64) {
    return { valid: false };
  }

  if (version !== TOKEN_VERSION) {
    return { valid: false };
  }

  const expectedSignature = signPayload(payloadBase64);
  if (!safeStringEqual(expectedSignature, signatureBase64)) {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payloadBase64)) as ShareTokenPayload;
    if (
      !parsed ||
      typeof parsed.assetId !== "string" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.nonce !== "string"
    ) {
      return { valid: false };
    }

    if (!parsed.assetId || !parsed.nonce) {
      return { valid: false };
    }

    return { valid: true, payload: parsed };
  } catch {
    return { valid: false };
  }
}
