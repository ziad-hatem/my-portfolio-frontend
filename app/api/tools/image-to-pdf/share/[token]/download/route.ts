import { NextRequest, NextResponse } from "next/server";
import {
  findToolPdfByTokenHash,
  getToolPdfBufferByAssetId,
} from "@/lib/tools/image-to-pdf-storage";
import {
  hashShareToken,
  verifySignedShareToken,
} from "@/lib/tools/image-to-pdf-security";
import { enforceShareDownloadGuard } from "@/lib/tools/image-to-pdf-abuse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ token: string }>;
}

function normalizeToken(raw: string): string {
  return decodeURIComponent(raw || "").trim();
}

function toSafeDownloadName(name: string): string {
  const base = name.replace(/\.pdf$/i, "").trim();
  const sanitized = base
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);

  return `${sanitized || "converted-images"}.pdf`;
}

function isExpired(value: Date | string | number, now: Date): boolean {
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime() <= now.getTime();
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const downloadGuard = await enforceShareDownloadGuard(request);
    if (!downloadGuard.allowed) {
      return NextResponse.json(
        { success: false, error: downloadGuard.error || "Rate limit exceeded" },
        { status: downloadGuard.status || 429 }
      );
    }

    const { token } = await params;
    const rawToken = normalizeToken(token);
    const verified = verifySignedShareToken(rawToken);

    if (!verified.valid || !verified.payload) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    const record = await findToolPdfByTokenHash(hashShareToken(rawToken));
    if (!record || !record.asset) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    if (record.asset.assetId !== verified.payload.assetId) {
      return NextResponse.json(
        { success: false, error: "Share token not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const revoked = Boolean(record.token.revokedAt);
    const tokenExpired =
      verified.payload.exp * 1000 <= now.getTime() ||
      isExpired(record.token.expiresAt, now);
    const assetExpired = isExpired(record.asset.expiresAt, now);

    if (revoked || tokenExpired || assetExpired) {
      return NextResponse.json(
        { success: false, error: "Share token expired" },
        { status: 410 }
      );
    }

    const buffer = await getToolPdfBufferByAssetId(record.asset.assetId);
    if (!buffer) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `attachment; filename="${toSafeDownloadName(
          record.asset.filename
        )}"`,
        "Cache-Control": "private, max-age=60, no-transform",
      },
    });
  } catch (error) {
    console.error("[ImageToPDF Download] Failed to stream PDF:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
