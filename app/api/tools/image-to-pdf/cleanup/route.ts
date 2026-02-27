import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredToolPdfAssets } from "@/lib/tools/image-to-pdf-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readCleanupSecret(request: NextRequest): string | null {
  const headerSecret = request.headers.get("x-tools-cleanup-secret");
  if (headerSecret) {
    return headerSecret.trim();
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authorization.slice("bearer ".length).trim();
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.TOOLS_CLEANUP_SECRET;
  if (!expected) {
    return false;
  }

  const provided = readCleanupSecret(request);
  return provided === expected;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const now = new Date();
    const result = await cleanupExpiredToolPdfAssets(now);

    return NextResponse.json({
      success: true,
      now: now.toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("[ImageToPDF Cleanup] Failed to cleanup assets:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
