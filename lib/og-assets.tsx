import { createHash } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import { ImageResponse } from "next/og";
import { Binary, Collection } from "mongodb";
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
}

interface PostRenderInput {
  assetKey: string;
  title: string;
  image: string | null;
  author: string | null;
}

const OG_ASSETS_COLLECTION = "og_assets";
const OG_ASSET_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const OG_FS_CACHE_DIR = path.join(process.cwd(), ".next", "cache", "og-assets");

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

function getBaseOrigin(): string {
  return process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
}

function makeEtag(buffer: Buffer): string {
  return `"${createHash("sha256").update(buffer).digest("hex")}"`;
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

async function renderProjectImage(input: ProjectRenderInput): Promise<Buffer> {
  const logoUrl = new URL("/logo.png", getBaseOrigin()).toString();
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          backgroundColor: "#0a0a0a",
          padding: "56px",
        }}
      >
        {input.image ? (
          <img
            src={input.image}
            alt="Project image"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.26,
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.86) 100%)",
          }}
        />

        <div style={{ position: "relative", display: "flex" }}>
          <img src={logoUrl} alt="Logo" width={220} height={50} />
        </div>

        <div
          style={{
            position: "relative",
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
          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "72px",
              lineHeight: 1.12,
              maxWidth: "90%",
            }}
          >
            {input.title}
          </h1>
          <div style={{ color: "#a1a1aa", fontSize: "24px" }}>
            Portfolio by Ziad Hatem
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
  const logoUrl = new URL("/logo.png", getBaseOrigin()).toString();
  const response = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          backgroundColor: "#0a0a0a",
          padding: "56px",
        }}
      >
        {input.image ? (
          <img
            src={input.image}
            alt="Post image"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.3,
            }}
          />
        ) : null}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%)",
          }}
        />

        <div style={{ position: "relative", display: "flex" }}>
          <img src={logoUrl} alt="Logo" width={220} height={50} />
        </div>

        <div
          style={{
            position: "relative",
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
          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "70px",
              lineHeight: 1.12,
              maxWidth: "90%",
            }}
          >
            {input.title}
          </h1>
          <div style={{ color: "#a1a1aa", fontSize: "24px" }}>
            Blog by Ziad Hatem
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
  const existing = await readOgAsset(input.assetKey, { allowStale: true, preferFs: true });
  if (existing && isOgAssetFresh(existing.updatedAt)) {
    return existing;
  }

  const buffer = await renderProjectImage(input);
  return writeOgAsset("project", input.assetKey, buffer, {
    title: input.title,
    image: input.image || "",
    company: input.company || "",
  });
}

export async function ensurePostOgAsset(
  input: PostRenderInput
): Promise<OgAssetPayload> {
  const existing = await readOgAsset(input.assetKey, { allowStale: true, preferFs: true });
  if (existing && isOgAssetFresh(existing.updatedAt)) {
    return existing;
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
  });
}

export async function ensureLegacyPostOgAsset(input: {
  title: string;
  image: string | null;
  author: string | null;
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
  });
}
