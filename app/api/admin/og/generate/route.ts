import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { put } from "@vercel/blob";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  ensureLegacyPostOgAsset,
  ensureLegacyProjectOgAsset,
} from "@/lib/og-assets";
import { buildPostOgPath, buildProjectOgPath } from "@/lib/og-keys";

type OgGenerateKind = "project" | "post";

interface OgGenerateRequestBody {
  kind?: unknown;
  title?: unknown;
  image?: unknown;
  company?: unknown;
  author?: unknown;
}

const GENERATED_OG_BLOB_PREFIX = "uploads/admin/og-generated";
const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

function withCacheBust(permalink: string): string {
  const separator = permalink.includes("?") ? "&" : "?";
  return `${permalink}${separator}v=${Date.now()}`;
}

function normalizeFallbackImagePermalink(image: string | null): string {
  const trimmed = image?.trim();
  if (!trimmed) {
    return "/cover.jpg";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
}

function sanitizeBlobSegment(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function uploadOgBufferToBlob(input: {
  kind: OgGenerateKind;
  title: string;
  buffer: Buffer;
}): Promise<string> {
  const safeTitle = sanitizeBlobSegment(input.title) || input.kind;
  const stamp = Date.now().toString(36);
  const digest = createHash("sha256")
    .update(`${input.kind}|${input.title}|${stamp}`)
    .digest("hex")
    .slice(0, 14);
  const pathname = `${GENERATED_OG_BLOB_PREFIX}/${input.kind}-${stamp}-${safeTitle}-${digest}.png`;

  const blob = await put(pathname, input.buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
  });

  return blob.url;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toAbsoluteImageUrl(source: string | null, baseOrigin: string): string | null {
  const trimmed = source?.trim();
  if (!trimmed || trimmed.startsWith("data:image/")) {
    return null;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    try {
      return new URL(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, baseOrigin).toString();
    } catch {
      return null;
    }
  }
}

async function loadRenderableImageBuffer(
  source: string | null,
  baseOrigin: string
): Promise<Buffer | null> {
  const absoluteUrl = toAbsoluteImageUrl(source, baseOrigin);
  if (!absoluteUrl) {
    return null;
  }

  try {
    const response = await fetch(absoluteUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const sourceBuffer = Buffer.from(arrayBuffer);

    return await sharp(sourceBuffer, { failOn: "none" })
      .resize(1200, 630, { fit: "cover", position: "centre" })
      .flatten({ background: "#0b0f14" })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

async function prepareLogoBuffer(sourceBuffer: Buffer): Promise<Buffer | null> {
  try {
    return await sharp(sourceBuffer, { failOn: "none" })
      .resize(260, 64, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

async function loadLogoBuffer(baseOrigin: string): Promise<Buffer | null> {
  try {
    const localBuffer = await readFile(LOGO_PATH);
    const preparedLocalLogo = await prepareLogoBuffer(localBuffer);
    if (preparedLocalLogo) {
      return preparedLocalLogo;
    }
  } catch {
    // continue to remote fallback
  }

  const absoluteLogoUrl = toAbsoluteImageUrl("/logo.png", baseOrigin);
  if (!absoluteLogoUrl) {
    return null;
  }

  try {
    const response = await fetch(absoluteLogoUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const remoteBuffer = Buffer.from(arrayBuffer);
    return prepareLogoBuffer(remoteBuffer);
  } catch {
    return null;
  }
}

function wrapTitle(title: string, maxCharsPerLine = 30, maxLines = 2): string[] {
  const normalized = String(title || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return ["Untitled"];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
    if (lines.length >= maxLines) {
      break;
    }
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === 0) {
    lines.push(normalized.slice(0, maxCharsPerLine));
  }

  const consumedLength = lines.join(" ").length;
  if (normalized.length > consumedLength) {
    const lastIndex = lines.length - 1;
    if (lastIndex >= 0) {
      const last = lines[lastIndex];
      const clipped =
        last.length > maxCharsPerLine - 3
          ? last.slice(0, maxCharsPerLine - 3)
          : last;
      lines[lastIndex] = `${clipped}...`;
    }
  }

  return lines.slice(0, maxLines);
}

async function generateStoredFallbackOgImage(input: {
  kind: OgGenerateKind;
  title: string;
  image: string | null;
  subtitle: string;
  baseOrigin: string;
}): Promise<string> {
  const [preparedImage, logoBuffer] = await Promise.all([
    loadRenderableImageBuffer(input.image, input.baseOrigin),
    loadLogoBuffer(input.baseOrigin),
  ]);
  const titleLines = wrapTitle(input.title);
  const titleFontSize = 64;
  const titleLineStep = 74;
  const titleBlockHeight =
    titleFontSize + (Math.max(titleLines.length, 1) - 1) * titleLineStep;
  const titleStartY = 590 - titleBlockHeight;
  const subtitleY = Math.max(120, titleStartY - 30);
  const brandTextX = logoBuffer ? 326 : 56;
  const escapedSubtitle = escapeXml(input.subtitle);
  const titleTextSvg = titleLines
    .map(
      (line, index) =>
        `<tspan x="56" dy="${index === 0 ? 0 : titleLineStep}">${escapeXml(line)}</tspan>`
    )
    .join("");

  const overlaySvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0.05)" />
          <stop offset="70%" stop-color="rgba(0,0,0,0.55)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.75)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="630" fill="url(#g)" />
      <text x="${brandTextX}" y="86" fill="#E4E4E7" font-size="32" font-weight="600" font-family="Arial, sans-serif">Ziad Hatem</text>
      <text x="56" y="${subtitleY}" fill="#A1A1AA" font-size="30" font-family="Arial, sans-serif">${escapedSubtitle}</text>
      <text x="56" y="${titleStartY}" fill="#FFFFFF" font-size="${titleFontSize}" font-weight="700" font-family="Arial, sans-serif">${titleTextSvg}</text>
    </svg>`,
    "utf8"
  );

  const compositeInputs: sharp.OverlayOptions[] = [];
  if (preparedImage) {
    compositeInputs.push({
      input: preparedImage,
      blend: "over",
    });
  }
  compositeInputs.push({
    input: overlaySvg,
    blend: "over",
  });
  if (logoBuffer) {
    compositeInputs.push({
      input: logoBuffer,
      left: 56,
      top: 40,
      blend: "over",
    });
  }

  const pngBuffer = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: "#0b0f14",
    },
  })
    .composite(compositeInputs)
    .png({ quality: 92, compressionLevel: 9 })
    .toBuffer();

  return uploadOgBufferToBlob({
    kind: input.kind,
    title: input.title,
    buffer: pngBuffer,
  });
}

async function resolveFallbackPermalink(input: {
  kind: OgGenerateKind;
  title: string;
  image: string | null;
  subtitle: string;
  baseOrigin: string;
}): Promise<{ permalink: string; generated: boolean }> {
  try {
    const permalink = await generateStoredFallbackOgImage(input);
    return { permalink, generated: true };
  } catch (error) {
    console.error("[Admin OG] Failed to generate fallback stored OG image:", error);
    return {
      permalink: normalizeFallbackImagePermalink(input.image),
      generated: false,
    };
  }
}

function unauthorizedResponse(request: NextRequest) {
  const auth = validateAdminApiKey(request);
  if (auth.valid) {
    return null;
  }

  return NextResponse.json(
    { success: false, error: auth.error },
    { status: auth.status || 401 }
  );
}

function sanitizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateBody(body: unknown):
  | { valid: false; error: string }
  | { valid: true; kind: OgGenerateKind; title: string; image: string | null; company: string | null; author: string | null } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Invalid request body" };
  }

  const payload = body as OgGenerateRequestBody;
  const kind = payload.kind;
  if (kind !== "project" && kind !== "post") {
    return { valid: false, error: "Field 'kind' must be 'project' or 'post'" };
  }

  const title = sanitizeOptionalString(payload.title);
  if (!title) {
    return { valid: false, error: "Field 'title' is required" };
  }

  return {
    valid: true,
    kind,
    title,
    image: sanitizeOptionalString(payload.image),
    company: sanitizeOptionalString(payload.company),
    author: sanitizeOptionalString(payload.author),
  };
}

export async function POST(request: NextRequest) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration error: BLOB_READ_WRITE_TOKEN is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const validation = validateBody(body);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    if (validation.kind === "project") {
      try {
        const generated = await ensureLegacyProjectOgAsset({
          title: validation.title,
          image: validation.image,
          company: validation.company,
          baseUrl: request.nextUrl.origin,
          forceRegenerate: true,
        });
        let permalink = withCacheBust(buildProjectOgPath(generated.assetKey));
        let warning: string | undefined;
        try {
          const blobUrl = await uploadOgBufferToBlob({
            kind: "project",
            title: validation.title,
            buffer: Buffer.from(generated.buffer),
          });
          permalink = withCacheBust(blobUrl);
        } catch (blobError) {
          console.error("[Admin OG] Failed to upload project OG to Blob:", blobError);
          warning =
            "Generated OG image, but failed to store on Blob. Using API permalink.";
        }

        return NextResponse.json({
          success: true,
          warning,
          data: {
            kind: "project",
            assetKey: generated.assetKey,
            permalink,
          },
        });
      } catch (firstError) {
        if (!validation.image) {
          console.error(
            "[Admin OG] Project OG failed without source image, using fallback permalink:",
            firstError
          );
          const fallback = await resolveFallbackPermalink({
            kind: "project",
            title: validation.title,
            image: null,
            subtitle: validation.company || "Portfolio by Ziad Hatem",
            baseOrigin: request.nextUrl.origin,
          });
          return NextResponse.json({
            success: true,
            warning:
              fallback.generated
                ? "Generated SEO OG image using compatibility renderer."
                : "OG generation failed. Using fallback image permalink instead.",
            data: {
              kind: "project",
              permalink: withCacheBust(fallback.permalink),
              fallback: true,
              generated: fallback.generated,
            },
          });
        }

        console.warn(
          "[Admin OG] Failed with source image, retrying without it:",
          firstError
        );

        try {
          const generated = await ensureLegacyProjectOgAsset({
            title: validation.title,
            image: null,
            company: validation.company,
            baseUrl: request.nextUrl.origin,
            forceRegenerate: true,
          });
          let permalink = withCacheBust(buildProjectOgPath(generated.assetKey));
          let warning =
            "OG generated without source image because the uploaded image format is not supported by the renderer.";
          try {
            const blobUrl = await uploadOgBufferToBlob({
              kind: "project",
              title: validation.title,
              buffer: Buffer.from(generated.buffer),
            });
            permalink = withCacheBust(blobUrl);
          } catch (blobError) {
            console.error("[Admin OG] Failed to upload project OG retry result to Blob:", blobError);
            warning =
              "OG generated without source image, but failed to store on Blob. Using API permalink.";
          }

          return NextResponse.json({
            success: true,
            warning,
            data: {
              kind: "project",
              assetKey: generated.assetKey,
              permalink,
            },
          });
        } catch (secondError) {
          console.error(
            "[Admin OG] Project OG retry failed, using fallback permalink:",
            secondError
          );
          const fallback = await resolveFallbackPermalink({
            kind: "project",
            title: validation.title,
            image: validation.image,
            subtitle: validation.company || "Portfolio by Ziad Hatem",
            baseOrigin: request.nextUrl.origin,
          });
          return NextResponse.json({
            success: true,
            warning:
              fallback.generated
                ? "Generated SEO OG image using compatibility renderer."
                : "OG generation failed. Using fallback image permalink instead.",
            data: {
              kind: "project",
              permalink: withCacheBust(fallback.permalink),
              fallback: true,
              generated: fallback.generated,
            },
          });
        }
      }
    }

    try {
      const generated = await ensureLegacyPostOgAsset({
        title: validation.title,
        image: validation.image,
        author: validation.author,
        baseUrl: request.nextUrl.origin,
        forceRegenerate: true,
      });
      let permalink = withCacheBust(buildPostOgPath(generated.assetKey));
      let warning: string | undefined;
      try {
        const blobUrl = await uploadOgBufferToBlob({
          kind: "post",
          title: validation.title,
          buffer: Buffer.from(generated.buffer),
        });
        permalink = withCacheBust(blobUrl);
      } catch (blobError) {
        console.error("[Admin OG] Failed to upload post OG to Blob:", blobError);
        warning =
          "Generated OG image, but failed to store on Blob. Using API permalink.";
      }

      return NextResponse.json({
        success: true,
        warning,
        data: {
          kind: "post",
          assetKey: generated.assetKey,
          permalink,
        },
      });
    } catch (firstError) {
      if (!validation.image) {
        console.error(
          "[Admin OG] Post OG failed without source image, using fallback permalink:",
          firstError
        );
        const fallback = await resolveFallbackPermalink({
          kind: "post",
          title: validation.title,
          image: null,
          subtitle: validation.author || "Blog by Ziad Hatem",
          baseOrigin: request.nextUrl.origin,
        });
        return NextResponse.json({
          success: true,
          warning:
            fallback.generated
              ? "Generated SEO OG image using compatibility renderer."
              : "OG generation failed. Using fallback image permalink instead.",
          data: {
            kind: "post",
            permalink: withCacheBust(fallback.permalink),
            fallback: true,
            generated: fallback.generated,
          },
        });
      }

      console.warn(
        "[Admin OG] Failed with source image, retrying without it:",
        firstError
      );

      try {
        const generated = await ensureLegacyPostOgAsset({
          title: validation.title,
          image: null,
          author: validation.author,
          baseUrl: request.nextUrl.origin,
          forceRegenerate: true,
        });
        let permalink = withCacheBust(buildPostOgPath(generated.assetKey));
        let warning =
          "OG generated without source image because the uploaded image format is not supported by the renderer.";
        try {
          const blobUrl = await uploadOgBufferToBlob({
            kind: "post",
            title: validation.title,
            buffer: Buffer.from(generated.buffer),
          });
          permalink = withCacheBust(blobUrl);
        } catch (blobError) {
          console.error("[Admin OG] Failed to upload post OG retry result to Blob:", blobError);
          warning =
            "OG generated without source image, but failed to store on Blob. Using API permalink.";
        }

        return NextResponse.json({
          success: true,
          warning,
          data: {
            kind: "post",
            assetKey: generated.assetKey,
            permalink,
          },
        });
      } catch (secondError) {
        console.error(
          "[Admin OG] Post OG retry failed, using fallback permalink:",
          secondError
        );
        const fallback = await resolveFallbackPermalink({
          kind: "post",
          title: validation.title,
          image: validation.image,
          subtitle: validation.author || "Blog by Ziad Hatem",
          baseOrigin: request.nextUrl.origin,
        });
        return NextResponse.json({
          success: true,
          warning:
            fallback.generated
              ? "Generated SEO OG image using compatibility renderer."
              : "OG generation failed. Using fallback image permalink instead.",
          data: {
            kind: "post",
            permalink: withCacheBust(fallback.permalink),
            fallback: true,
            generated: fallback.generated,
          },
        });
      }
    }
  } catch (error) {
    console.error("[Admin OG] Failed to generate OG image:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
