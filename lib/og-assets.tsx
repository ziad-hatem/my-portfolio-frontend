import { createHash } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { Binary, Collection } from "mongodb";
import sharp from "sharp";
import { getDatabase } from "./mongodb";
import { OgAssetKind, buildLegacyOgAssetKey } from "./og-keys";

interface OgAssetDoc {
  assetKey: string;
  kind: OgAssetKind;
  etag: string;
  contentType: "image/png";
  data: Binary;
  createdAt: Date;
  updatedAt: Date;
  meta: Record<string, string>;
}

interface OgAssetPayload {
  assetKey: string;
  etag: string;
  contentType: string;
  buffer: Uint8Array;
  updatedAt: Date;
}

interface ProjectRenderInput {
  assetKey: string;
  title: string;
  image: string | null;
  company: string | null;
  baseUrl?: string | null;
  forceRegenerate?: boolean;
}

interface PostRenderInput {
  assetKey: string;
  title: string;
  image: string | null;
  author: string | null;
  baseUrl?: string | null;
  forceRegenerate?: boolean;
}

const OG_ASSETS_COLLECTION = "og_assets";
const OG_ASSET_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const OG_FS_CACHE_DIR = path.join(process.cwd(), ".next", "cache", "og-assets");
const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

let cachedLogoDataUrl: string | null = null;

interface OgFsCacheMeta {
  etag: string;
  contentType: "image/png";
  updatedAt: string;
}

export function getOgImmutableHeaders(etag: string): Record<string, string> {
  const immutable = "public, max-age=31536000, s-maxage=31536000, immutable";

  return {
    "Content-Type": "image/png",
    "Cache-Control": immutable,
    "CDN-Cache-Control": immutable,
    "Vercel-CDN-Cache-Control": "max-age=31536000",
    ETag: etag,
  };
}

function getBaseOrigin(preferred?: string | null): string {
  const candidates = [
    preferred,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    "http://localhost:3000",
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      return new URL(candidate).origin;
    } catch {
      continue;
    }
  }

  return "http://localhost:3000";
}

function toAbsoluteImageUrl(source: string | null | undefined, baseOrigin: string): string | null {
  const trimmed = source?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
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

function parseDataUrl(value: string): { mimeType: string; buffer: Buffer } | null {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64Payload = match[2];

  try {
    return {
      mimeType,
      buffer: Buffer.from(base64Payload, "base64"),
    };
  } catch {
    return null;
  }
}

async function toPngDataUrl(buffer: Buffer): Promise<string> {
  const pngBuffer = await sharp(buffer, { failOn: "none" })
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .flatten({ background: "#000000" })
    .png()
    .toBuffer();

  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}

async function toLogoDataUrl(buffer: Buffer): Promise<string> {
  const pngBuffer = await sharp(buffer, { failOn: "none" })
    .resize(260, 64, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return `data:image/png;base64,${pngBuffer.toString("base64")}`;
}

async function getRenderableImageSource(
  source: string | null | undefined,
  baseOrigin: string
): Promise<string | null> {
  const absoluteSource = toAbsoluteImageUrl(source, baseOrigin);
  if (!absoluteSource) {
    return null;
  }

  if (absoluteSource.startsWith("data:image/")) {
    const parsed = parseDataUrl(absoluteSource);
    if (!parsed) {
      return null;
    }

    try {
      return await toPngDataUrl(parsed.buffer);
    } catch {
      return null;
    }
  }

  try {
    const response = await fetch(absoluteSource, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const fetchedBuffer = Buffer.from(arrayBuffer);

    try {
      return await toPngDataUrl(fetchedBuffer);
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

async function getLogoSource(baseOrigin: string): Promise<string | null> {
  if (cachedLogoDataUrl) {
    return cachedLogoDataUrl;
  }

  try {
    const logoBuffer = await readFile(LOGO_PATH);
    cachedLogoDataUrl = await toLogoDataUrl(logoBuffer);
    return cachedLogoDataUrl;
  } catch (error) {
    console.warn("[OG Assets] Failed to load local logo image:", error);
    try {
      const fallbackLogo = await getRenderableImageSource("/logo.png", baseOrigin);
      if (fallbackLogo) {
        const parsed = parseDataUrl(fallbackLogo);
        if (!parsed) {
          return null;
        }

        cachedLogoDataUrl = await toLogoDataUrl(parsed.buffer);
        return cachedLogoDataUrl;
      }
    } catch {
      // keep returning null below
    }

    return null;
  }
}

function makeEtag(buffer: Buffer): string {
  return `"${createHash("sha256").update(buffer).digest("hex")}"`;
}

function splitOgTitleLines(
  title: string,
  maxCharsPerLine = 28,
  maxLines = 2
): string[] {
  const normalized = String(title || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return ["Untitled"];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;

    if (lines.length >= maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
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

function isOgAssetFresh(updatedAt: Date): boolean {
  return Date.now() - updatedAt.getTime() < OG_ASSET_MAX_AGE_MS;
}

function buildFileCacheKey(assetKey: string): string {
  return createHash("sha256").update(assetKey).digest("hex");
}

function buildFileCachePaths(assetKey: string): { imagePath: string; metaPath: string } {
  const key = buildFileCacheKey(assetKey);
  return {
    imagePath: path.join(OG_FS_CACHE_DIR, `${key}.png`),
    metaPath: path.join(OG_FS_CACHE_DIR, `${key}.json`),
  };
}

async function ensureFsCacheDir(): Promise<void> {
  await mkdir(OG_FS_CACHE_DIR, { recursive: true });
}

async function readOgAssetFromFsCache(assetKey: string): Promise<OgAssetPayload | null> {
  const { imagePath, metaPath } = buildFileCachePaths(assetKey);

  try {
    const [metaRaw, imageRaw] = await Promise.all([
      readFile(metaPath, "utf8"),
      readFile(imagePath),
    ]);

    const parsed = JSON.parse(metaRaw) as OgFsCacheMeta;
    const updatedAt = new Date(parsed.updatedAt);

    if (!Number.isFinite(updatedAt.getTime()) || !isOgAssetFresh(updatedAt)) {
      await Promise.allSettled([rm(imagePath, { force: true }), rm(metaPath, { force: true })]);
      return null;
    }

    return {
      assetKey,
      etag: parsed.etag,
      contentType: parsed.contentType,
      buffer: Uint8Array.from(imageRaw),
      updatedAt,
    };
  } catch {
    return null;
  }
}

async function writeOgAssetToFsCache(payload: OgAssetPayload): Promise<void> {
  const { imagePath, metaPath } = buildFileCachePaths(payload.assetKey);

  try {
    await ensureFsCacheDir();
    await Promise.all([
      writeFile(imagePath, Buffer.from(payload.buffer)),
      writeFile(
        metaPath,
        JSON.stringify(
          {
            etag: payload.etag,
            contentType: "image/png",
            updatedAt: payload.updatedAt.toISOString(),
          } satisfies OgFsCacheMeta
        )
      ),
    ]);
  } catch (error) {
    console.warn("[OG Assets] Failed to write filesystem cache:", error);
  }
}

async function getOgAssetsCollection(): Promise<Collection<OgAssetDoc>> {
  const db = await getDatabase();
  return db.collection<OgAssetDoc>(OG_ASSETS_COLLECTION);
}

async function readOgAssetFromDb(assetKey: string): Promise<OgAssetPayload | null> {
  const collection = await getOgAssetsCollection();
  const doc = await collection.findOne({ assetKey });

  if (!doc) {
    return null;
  }

  const raw = doc.data.buffer;
  const end = typeof doc.data.position === "number" ? doc.data.position : raw.length;
  const payload: OgAssetPayload = {
    assetKey: doc.assetKey,
    etag: doc.etag,
    contentType: doc.contentType,
    buffer: Uint8Array.from(raw.subarray(0, end)),
    updatedAt: doc.updatedAt,
  };

  return payload;
}

async function readOgAsset(
  assetKey: string,
  options: { allowStale?: boolean; preferFs?: boolean } = {}
): Promise<OgAssetPayload | null> {
  const allowStale = options.allowStale === true;
  const preferFs = options.preferFs !== false;

  if (!allowStale && preferFs) {
    const fileAsset = await readOgAssetFromFsCache(assetKey);
    if (fileAsset) {
      return fileAsset;
    }
  }

  const payload = await readOgAssetFromDb(assetKey);
  if (!payload) {
    return null;
  }

  if (!allowStale && !isOgAssetFresh(payload.updatedAt)) {
    return null;
  }

  if (isOgAssetFresh(payload.updatedAt)) {
    await writeOgAssetToFsCache(payload);
  }

  return payload;
}

async function writeOgAsset(
  kind: OgAssetKind,
  assetKey: string,
  buffer: Buffer,
  meta: Record<string, string>
): Promise<OgAssetPayload> {
  const collection = await getOgAssetsCollection();
  const now = new Date();
  const etag = makeEtag(buffer);

  await collection.updateOne(
    { assetKey },
    {
      $set: {
        kind,
        etag,
        contentType: "image/png",
        data: new Binary(buffer),
        updatedAt: now,
        meta,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  const payload: OgAssetPayload = {
    assetKey,
    etag,
    contentType: "image/png",
    buffer: Uint8Array.from(buffer),
    updatedAt: now,
  };

  await writeOgAssetToFsCache(payload);
  return payload;
}

async function renderProjectImage(input: ProjectRenderInput, baseOrigin: string): Promise<Buffer> {
  const [logoUrl, imageUrl] = await Promise.all([
    getLogoSource(baseOrigin),
    getRenderableImageSource(input.image, baseOrigin),
  ]);
  const titleLines = splitOgTitleLines(input.title, 28, 2);
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#0a0a0a",
          display: "flex",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Project image"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              opacity: 1,
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            padding: "56px",
          }}
        >
          {logoUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img src={logoUrl} alt="Logo" width={220} height={54} />
              <div style={{ color: "#e4e4e7", fontSize: "30px", fontWeight: 600 }}>
                Ziad Hatem
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", color: "#e4e4e7", fontSize: "30px", fontWeight: 600 }}>
              Ziad Hatem
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {input.company ? (
              <div style={{ color: "#a1a1aa", fontSize: "28px" }}>
                {input.company}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxWidth: "90%",
                lineHeight: 1.08,
              }}
            >
              {titleLines.map((line, index) => (
                <div
                  key={`project-title-${index}`}
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "66px",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
            <div style={{ color: "#a1a1aa", fontSize: "24px" }}>
              Portfolio by Ziad Hatem
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function renderPostImage(input: PostRenderInput): Promise<Buffer> {
  const baseOrigin = getBaseOrigin(input.baseUrl);
  const [logoUrl, imageUrl] = await Promise.all([
    getLogoSource(baseOrigin),
    getRenderableImageSource(input.image, baseOrigin),
  ]);
  const titleLines = splitOgTitleLines(input.title, 28, 2);
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          backgroundColor: "#0a0a0a",
          display: "flex",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Post image"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              opacity: 1,
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "14px",
            padding: "56px",
          }}
        >
          {logoUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <img src={logoUrl} alt="Logo" width={220} height={54} />
              <div style={{ color: "#e4e4e7", fontSize: "30px", fontWeight: 600 }}>
                Ziad Hatem
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", color: "#e4e4e7", fontSize: "30px", fontWeight: 600 }}>
              Ziad Hatem
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {input.author ? (
              <div style={{ color: "#a1a1aa", fontSize: "28px" }}>
                {input.author}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxWidth: "90%",
                lineHeight: 1.08,
              }}
            >
              {titleLines.map((line, index) => (
                <div
                  key={`post-title-${index}`}
                  style={{
                    margin: 0,
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "64px",
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
            <div style={{ color: "#a1a1aa", fontSize: "24px" }}>
              Blog by Ziad Hatem
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getOgAssetByKey(
  assetKey: string
): Promise<OgAssetPayload | null> {
  return readOgAsset(assetKey);
}

export async function ensureProjectOgAsset(
  input: ProjectRenderInput
): Promise<OgAssetPayload> {
  if (!input.forceRegenerate) {
    const existing = await readOgAsset(input.assetKey, { allowStale: true, preferFs: true });
    if (existing && isOgAssetFresh(existing.updatedAt)) {
      return existing;
    }
  }

  const baseOrigin = getBaseOrigin(input.baseUrl);
  const buffer = await renderProjectImage(input, baseOrigin);
  return writeOgAsset("project", input.assetKey, buffer, {
    title: input.title,
    image: input.image || "",
    company: input.company || "",
  });
}

export async function ensurePostOgAsset(
  input: PostRenderInput
): Promise<OgAssetPayload> {
  if (!input.forceRegenerate) {
    const existing = await readOgAsset(input.assetKey, { allowStale: true, preferFs: true });
    if (existing && isOgAssetFresh(existing.updatedAt)) {
      return existing;
    }
  }

  const buffer = await renderPostImage(input);
  return writeOgAsset("post", input.assetKey, buffer, {
    title: input.title,
    image: input.image || "",
    author: input.author || "",
  });
}

export async function ensureLegacyProjectOgAsset(input: {
  title: string;
  image: string | null;
  company: string | null;
  baseUrl?: string | null;
  forceRegenerate?: boolean;
}): Promise<OgAssetPayload> {
  const assetKey = buildLegacyOgAssetKey(
    "project",
    input.title,
    input.image,
    input.company
  );
  return ensureProjectOgAsset({
    assetKey,
    title: input.title,
    image: input.image,
    company: input.company,
    baseUrl: input.baseUrl,
    forceRegenerate: input.forceRegenerate,
  });
}

export async function ensureLegacyPostOgAsset(input: {
  title: string;
  image: string | null;
  author: string | null;
  baseUrl?: string | null;
  forceRegenerate?: boolean;
}): Promise<OgAssetPayload> {
  const assetKey = buildLegacyOgAssetKey(
    "post",
    input.title,
    input.image,
    input.author
  );
  return ensurePostOgAsset({
    assetKey,
    title: input.title,
    image: input.image,
    author: input.author,
    baseUrl: input.baseUrl,
    forceRegenerate: input.forceRegenerate,
  });
}
