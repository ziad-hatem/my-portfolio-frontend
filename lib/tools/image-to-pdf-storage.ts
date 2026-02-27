import { Collection, ObjectId } from "mongodb";
import { nanoid } from "nanoid";
import { getDatabase } from "@/lib/mongodb";
import {
  ConversionStatus,
  ToolPdfAssetRecord,
  ToolPdfChunkRecord,
  ToolPdfShareTokenRecord,
} from "./image-to-pdf-types";

const TOOL_PDF_ASSETS_COLLECTION = "tool_pdf_assets";
const TOOL_PDF_ASSET_CHUNKS_COLLECTION = "tool_pdf_asset_chunks";
const TOOL_PDF_SHARE_TOKENS_COLLECTION = "tool_pdf_share_tokens";
const PDF_CHUNK_BYTES = 512 * 1024;

let ensurePromise: Promise<void> | null = null;

interface ToolPdfAssetDoc extends ToolPdfAssetRecord {
  _id?: ObjectId;
}

interface ToolPdfChunkDoc extends Omit<ToolPdfChunkRecord, "data"> {
  data: Buffer | Uint8Array | { _bsontype?: string; value?: () => Uint8Array; buffer?: Uint8Array; position?: number };
  _id?: ObjectId;
}

interface ToolPdfShareTokenDoc extends ToolPdfShareTokenRecord {
  _id?: ObjectId;
}

function stripId<T extends { _id?: ObjectId }>(doc: T): Omit<T, "_id"> {
  const { _id, ...rest } = doc;
  return rest;
}

async function assetsCollection(): Promise<Collection<ToolPdfAssetDoc>> {
  const db = await getDatabase();
  return db.collection<ToolPdfAssetDoc>(TOOL_PDF_ASSETS_COLLECTION);
}

async function chunksCollection(): Promise<Collection<ToolPdfChunkDoc>> {
  const db = await getDatabase();
  return db.collection<ToolPdfChunkDoc>(TOOL_PDF_ASSET_CHUNKS_COLLECTION);
}

async function shareTokensCollection(): Promise<Collection<ToolPdfShareTokenDoc>> {
  const db = await getDatabase();
  return db.collection<ToolPdfShareTokenDoc>(TOOL_PDF_SHARE_TOKENS_COLLECTION);
}

async function ensureInfrastructureInternal(): Promise<void> {
  const [assets, chunks, tokens] = await Promise.all([
    assetsCollection(),
    chunksCollection(),
    shareTokensCollection(),
  ]);

  await Promise.all([
    assets.createIndex({ assetId: 1 }, { unique: true }),
    assets.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    assets.createIndex({ createdAt: -1 }),
    assets.createIndex({ status: 1 }),
    chunks.createIndex({ assetId: 1, chunkIndex: 1 }, { unique: true }),
    chunks.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    chunks.createIndex({ assetId: 1 }),
    tokens.createIndex({ tokenHash: 1 }, { unique: true }),
    tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    tokens.createIndex({ assetId: 1 }),
  ]);
}

export async function ensureImageToPdfInfrastructure(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = ensureInfrastructureInternal().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}

export interface CreateToolPdfAssetInput {
  filename: string;
  pageCount: number;
  fileSizeBytes: number;
  ocrApplied: boolean;
  status: ConversionStatus;
  createdAt: Date;
  expiresAt: Date;
  clientFingerprintHash: string;
  ipHash: string;
}

export async function createToolPdfAsset(
  input: CreateToolPdfAssetInput
): Promise<ToolPdfAssetRecord> {
  await ensureImageToPdfInfrastructure();
  const assets = await assetsCollection();
  const assetId = nanoid(18);

  const doc: ToolPdfAssetDoc = {
    assetId,
    filename: input.filename,
    pageCount: input.pageCount,
    fileSizeBytes: input.fileSizeBytes,
    ocrApplied: input.ocrApplied,
    status: input.status,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    clientFingerprintHash: input.clientFingerprintHash,
    ipHash: input.ipHash,
  };

  await assets.insertOne(doc);
  return stripId(doc);
}

export async function storeToolPdfChunks(
  assetId: string,
  buffer: Buffer,
  expiresAt: Date
): Promise<number> {
  await ensureImageToPdfInfrastructure();
  const chunks = await chunksCollection();
  const docs: ToolPdfChunkDoc[] = [];

  for (let offset = 0, chunkIndex = 0; offset < buffer.length; offset += PDF_CHUNK_BYTES, chunkIndex += 1) {
    docs.push({
      assetId,
      chunkIndex,
      data: buffer.subarray(offset, Math.min(offset + PDF_CHUNK_BYTES, buffer.length)),
      expiresAt,
    });
  }

  if (docs.length > 0) {
    await chunks.insertMany(docs, { ordered: true });
  }

  return docs.length;
}

export async function createToolPdfShareToken(
  tokenHash: string,
  assetId: string,
  createdAt: Date,
  expiresAt: Date
): Promise<ToolPdfShareTokenRecord> {
  await ensureImageToPdfInfrastructure();
  const tokens = await shareTokensCollection();

  const tokenDoc: ToolPdfShareTokenDoc = {
    tokenHash,
    assetId,
    createdAt,
    expiresAt,
    revokedAt: null,
  };

  await tokens.insertOne(tokenDoc);
  return stripId(tokenDoc);
}

export interface ShareTokenLookup {
  token: ToolPdfShareTokenRecord;
  asset: ToolPdfAssetRecord | null;
}

export async function findToolPdfByTokenHash(
  tokenHash: string
): Promise<ShareTokenLookup | null> {
  await ensureImageToPdfInfrastructure();
  const [tokens, assets] = await Promise.all([shareTokensCollection(), assetsCollection()]);

  const tokenDoc = await tokens.findOne({ tokenHash });
  if (!tokenDoc) {
    return null;
  }

  const assetDoc = await assets.findOne({ assetId: tokenDoc.assetId });

  return {
    token: stripId(tokenDoc),
    asset: assetDoc ? stripId(assetDoc) : null,
  };
}

export async function getToolPdfBufferByAssetId(assetId: string): Promise<Buffer | null> {
  await ensureImageToPdfInfrastructure();
  const chunks = await chunksCollection();
  const docs = await chunks.find({ assetId }).sort({ chunkIndex: 1 }).toArray();
  if (docs.length === 0) {
    return null;
  }

  const chunkBuffers = docs.map((doc) => {
    const data = doc.data;

    if (Buffer.isBuffer(data)) {
      return data;
    }

    if (data instanceof Uint8Array) {
      return Buffer.from(data);
    }

    if (data && typeof data === "object" && data._bsontype === "Binary") {
      if (typeof data.value === "function") {
        return Buffer.from(data.value());
      }

      if (data.buffer instanceof Uint8Array) {
        const end = typeof data.position === "number" ? data.position : data.buffer.length;
        return Buffer.from(data.buffer.subarray(0, end));
      }
    }

    throw new Error("Invalid PDF chunk format in storage.");
  });

  return Buffer.concat(chunkBuffers);
}

export async function revokeToolPdfByTokenHash(tokenHash: string): Promise<boolean> {
  await ensureImageToPdfInfrastructure();
  const [tokens, assets, chunks] = await Promise.all([
    shareTokensCollection(),
    assetsCollection(),
    chunksCollection(),
  ]);

  const tokenDoc = await tokens.findOne({ tokenHash });
  if (!tokenDoc) {
    return false;
  }

  await Promise.all([
    tokens.updateOne(
      { tokenHash },
      { $set: { revokedAt: new Date(), expiresAt: new Date() } }
    ),
    assets.deleteOne({ assetId: tokenDoc.assetId }),
    chunks.deleteMany({ assetId: tokenDoc.assetId }),
    tokens.deleteMany({ assetId: tokenDoc.assetId }),
  ]);

  return true;
}

export interface CleanupResult {
  removedAssets: number;
  removedChunks: number;
  removedTokens: number;
}

export async function cleanupExpiredToolPdfAssets(now: Date): Promise<CleanupResult> {
  await ensureImageToPdfInfrastructure();
  const [assets, chunks, tokens] = await Promise.all([
    assetsCollection(),
    chunksCollection(),
    shareTokensCollection(),
  ]);

  const expiredAssets = await assets
    .find({ expiresAt: { $lte: now } }, { projection: { assetId: 1 } })
    .toArray();

  const revokedTokens = await tokens
    .find({ revokedAt: { $ne: null } }, { projection: { assetId: 1 } })
    .toArray();

  const assetIds = new Set<string>();
  expiredAssets.forEach((asset) => assetIds.add(asset.assetId));
  revokedTokens.forEach((token) => assetIds.add(token.assetId));

  if (assetIds.size === 0) {
    return {
      removedAssets: 0,
      removedChunks: 0,
      removedTokens: 0,
    };
  }

  const ids = [...assetIds];
  const [assetDelete, chunkDelete, tokenDelete] = await Promise.all([
    assets.deleteMany({ assetId: { $in: ids } }),
    chunks.deleteMany({ assetId: { $in: ids } }),
    tokens.deleteMany({ assetId: { $in: ids } }),
  ]);

  return {
    removedAssets: assetDelete.deletedCount || 0,
    removedChunks: chunkDelete.deletedCount || 0,
    removedTokens: tokenDelete.deletedCount || 0,
  };
}
