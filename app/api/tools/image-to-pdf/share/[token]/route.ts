import { NextRequest, NextResponse } from "next/server";
import {
  findToolPdfByTokenHash,
  revokeToolPdfByTokenHash,
} from "@/lib/tools/image-to-pdf-storage";
import {
  hashIdentifierForStorage,
  hashShareToken,
  verifySignedShareToken,
} from "@/lib/tools/image-to-pdf-security";
import { resolveRequestIdentity } from "@/lib/tools/image-to-pdf-abuse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

function isExpired(value: Date | string | number, now: Date): boolean {
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime() <= now.getTime();
}

function normalizeToken(raw: string): string {
  return decodeURIComponent(raw || "").trim();
}

function verifyToken(rawToken: string) {
  const verified = verifySignedShareToken(rawToken);
  if (!verified.valid || !verified.payload) {
    return null;
  }

  return {
    payload: verified.payload,
    tokenHash: hashShareToken(rawToken),
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const rawToken = normalizeToken(token);
    const tokenData = verifyToken(rawToken);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    const record = await findToolPdfByTokenHash(tokenData.tokenHash);
    if (!record || !record.asset) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    if (record.asset.assetId !== tokenData.payload.assetId) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const tokenExpiredByPayload = tokenData.payload.exp * 1000 <= now.getTime();
    const tokenExpiredByRecord = isExpired(record.token.expiresAt, now);
    const assetExpired = isExpired(record.asset.expiresAt, now);
    const revoked = Boolean(record.token.revokedAt);

    if (revoked || tokenExpiredByPayload || tokenExpiredByRecord || assetExpired) {
      return NextResponse.json(
        { success: false, error: "Share token expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      assetId: record.asset.assetId,
      filename: record.asset.filename,
      pageCount: record.asset.pageCount,
      fileSizeBytes: record.asset.fileSizeBytes,
      createdAt: record.asset.createdAt,
      expiresAt: record.asset.expiresAt,
    });
  } catch (error) {
    console.error("[ImageToPDF Share] Failed to read share token:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const rawToken = normalizeToken(token);
    const tokenData = verifyToken(rawToken);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    const record = await findToolPdfByTokenHash(tokenData.tokenHash);
    if (!record || !record.asset) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    const identity = resolveRequestIdentity(request);
    const ipHash = hashIdentifierForStorage(identity.ip);
    const fingerprintHash = identity.fingerprint
      ? hashIdentifierForStorage(identity.fingerprint)
      : null;

    const ownerMatch =
      record.asset.ipHash === ipHash ||
      (fingerprintHash !== null &&
        record.asset.clientFingerprintHash === fingerprintHash);

    if (!ownerMatch) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    await revokeToolPdfByTokenHash(tokenData.tokenHash);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[ImageToPDF Share] Failed to delete share token:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
