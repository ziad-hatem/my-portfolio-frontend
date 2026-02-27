import { NextRequest, NextResponse } from "next/server";
import { enforceConvertAbuseGuard } from "@/lib/tools/image-to-pdf-abuse";
import {
  DEFAULT_IMAGE_TO_PDF_OPTIONS,
  getImageToPdfLimits,
  parseImageToPdfOptions,
} from "@/lib/tools/image-to-pdf-types";
import {
  createToolPdfAsset,
  createToolPdfShareToken,
  storeToolPdfChunks,
} from "@/lib/tools/image-to-pdf-storage";
import {
  createSignedShareToken,
  hashIdentifierForStorage,
} from "@/lib/tools/image-to-pdf-security";
import {
  convertImageFilesToPdf,
  ImageToPdfError,
} from "@/lib/tools/image-to-pdf-converter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toPdfFilename(value: string): string {
  const stripped = value.replace(/\.pdf$/i, "").trim();
  if (!stripped) {
    return "converted-images.pdf";
  }

  return `${stripped}.pdf`;
}

function getBaseUrl(request: NextRequest): string {
  const publicUrl = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (publicUrl) {
    return publicUrl.replace(/\/+$/, "");
  }

  return request.nextUrl.origin.replace(/\/+$/, "");
}

function pickFormFiles(formData: FormData): File[] {
  const candidates = [...formData.getAll("files[]"), ...formData.getAll("files")];
  return candidates.filter((entry): entry is File => entry instanceof File);
}

function parseTurnstileToken(formData: FormData): string | null {
  const token = formData.get("turnstileToken");
  if (typeof token !== "string") {
    return null;
  }

  const trimmed = token.trim();
  return trimmed ? trimmed : null;
}

function parseOptionsField(formData: FormData): {
  ok: boolean;
  options?: typeof DEFAULT_IMAGE_TO_PDF_OPTIONS;
  error?: string;
} {
  const rawOptions = formData.get("options");
  if (rawOptions === null) {
    return {
      ok: true,
      options: DEFAULT_IMAGE_TO_PDF_OPTIONS,
    };
  }

  if (typeof rawOptions !== "string") {
    return {
      ok: false,
      error: "Invalid options field.",
    };
  }

  const trimmed = rawOptions.trim();
  if (!trimmed) {
    return {
      ok: true,
      options: DEFAULT_IMAGE_TO_PDF_OPTIONS,
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const result = parseImageToPdfOptions(parsed);
    if (!result.ok || !result.options) {
      return {
        ok: false,
        error: result.error || "Invalid conversion options.",
      };
    }

    return {
      ok: true,
      options: result.options,
    };
  } catch {
    return {
      ok: false,
      error: "Invalid JSON in options field.",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = pickFormFiles(formData);

    const optionsResult = parseOptionsField(formData);
    if (!optionsResult.ok || !optionsResult.options) {
      return NextResponse.json(
        { success: false, error: optionsResult.error || "Invalid options." },
        { status: 400 }
      );
    }

    const guard = await enforceConvertAbuseGuard(
      request,
      parseTurnstileToken(formData)
    );
    if (!guard.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: guard.error,
          challengeRequired: guard.challengeRequired,
        },
        { status: guard.status }
      );
    }

    const limits = getImageToPdfLimits();
    const conversion = await convertImageFilesToPdf(
      files,
      optionsResult.options,
      limits
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + limits.ttlSeconds * 1000);

    const asset = await createToolPdfAsset({
      filename: toPdfFilename(optionsResult.options.filename),
      pageCount: conversion.pageCount,
      fileSizeBytes: conversion.buffer.length,
      ocrApplied: conversion.ocrApplied,
      status: "stored",
      createdAt: now,
      expiresAt,
      clientFingerprintHash: hashIdentifierForStorage(
        guard.identity.fingerprint || `ip:${guard.identity.ip}`
      ),
      ipHash: hashIdentifierForStorage(guard.identity.ip),
    });

    await storeToolPdfChunks(asset.assetId, conversion.buffer, expiresAt);

    const signedToken = createSignedShareToken(asset.assetId, expiresAt);
    await createToolPdfShareToken(
      signedToken.tokenHash,
      asset.assetId,
      now,
      expiresAt
    );

    const baseUrl = getBaseUrl(request);
    const encodedToken = encodeURIComponent(signedToken.token);
    const shareUrl = `${baseUrl}/tools/image-to-pdf/share/${encodedToken}`;
    const downloadUrl = `${baseUrl}/api/tools/image-to-pdf/share/${encodedToken}/download`;

    return NextResponse.json({
      success: true,
      assetId: asset.assetId,
      shareUrl,
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      pageCount: conversion.pageCount,
      fileSizeBytes: conversion.buffer.length,
      ocrApplied: conversion.ocrApplied,
      warnings: conversion.warnings,
    });
  } catch (error) {
    if (error instanceof ImageToPdfError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }

    console.error("[ImageToPDF Convert] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
