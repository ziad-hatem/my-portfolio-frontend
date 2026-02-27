export type ImageToPdfPageSize = "a4" | "letter" | "legal" | "fit-image";
export type ImageToPdfOrientation = "auto" | "portrait" | "landscape";
export type ImageToPdfImageFit = "contain" | "cover";
export type ImageToPdfOptimizeFor = "screen" | "print";
export type ImageToPdfOcrLanguages = "eng+ara";

export type ConversionStatus =
  | "received"
  | "validating"
  | "converting"
  | "ocr"
  | "packaging"
  | "stored"
  | "failed";

export interface ImageToPdfOptions {
  pageSize: ImageToPdfPageSize;
  orientation: ImageToPdfOrientation;
  marginMm: number;
  imageFit: ImageToPdfImageFit;
  jpegQuality: number;
  ocrEnabled: boolean;
  ocrLanguages: ImageToPdfOcrLanguages;
  filename: string;
  optimizeFor: ImageToPdfOptimizeFor;
}

export interface ImageToPdfConvertResult {
  buffer: Buffer;
  pageCount: number;
  ocrApplied: boolean;
  warnings: string[];
}

export interface ToolPdfAssetRecord {
  assetId: string;
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

export interface ToolPdfShareTokenRecord {
  tokenHash: string;
  assetId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface ToolPdfChunkRecord {
  assetId: string;
  chunkIndex: number;
  data: Buffer;
  expiresAt: Date;
}

export interface ToolLimits {
  maxFiles: number;
  maxFileMb: number;
  maxTotalMb: number;
  maxPages: number;
  ttlSeconds: number;
}

function asPositiveInteger(input: string | undefined, fallback: number): number {
  if (!input) {
    return fallback;
  }

  const parsed = Number.parseInt(input, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

export function getImageToPdfLimits(): ToolLimits {
  return {
    maxFiles: asPositiveInteger(process.env.TOOLS_IMAGE_PDF_MAX_FILES, 25),
    maxFileMb: asPositiveInteger(process.env.TOOLS_IMAGE_PDF_MAX_FILE_MB, 15),
    maxTotalMb: asPositiveInteger(process.env.TOOLS_IMAGE_PDF_MAX_TOTAL_MB, 120),
    maxPages: asPositiveInteger(process.env.TOOLS_IMAGE_PDF_MAX_PAGES, 150),
    ttlSeconds: asPositiveInteger(process.env.TOOLS_IMAGE_PDF_TTL_SECONDS, 3600),
  };
}

export const DEFAULT_IMAGE_TO_PDF_OPTIONS: ImageToPdfOptions = {
  pageSize: "a4",
  orientation: "auto",
  marginMm: 8,
  imageFit: "contain",
  jpegQuality: 0.85,
  ocrEnabled: false,
  ocrLanguages: "eng+ara",
  filename: "converted-images",
  optimizeFor: "screen",
};

export interface ParseOptionsResult {
  ok: boolean;
  options?: ImageToPdfOptions;
  error?: string;
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_IMAGE_TO_PDF_OPTIONS.filename;
  }

  return trimmed
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .trim()
    .slice(0, 120)
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function isPageSize(value: unknown): value is ImageToPdfPageSize {
  return value === "a4" || value === "letter" || value === "legal" || value === "fit-image";
}

function isOrientation(value: unknown): value is ImageToPdfOrientation {
  return value === "auto" || value === "portrait" || value === "landscape";
}

function isImageFit(value: unknown): value is ImageToPdfImageFit {
  return value === "contain" || value === "cover";
}

function isOptimizeFor(value: unknown): value is ImageToPdfOptimizeFor {
  return value === "screen" || value === "print";
}

export function parseImageToPdfOptions(raw: unknown): ParseOptionsResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Invalid conversion options payload." };
  }

  const input = raw as Record<string, unknown>;
  const pageSize = isPageSize(input.pageSize)
    ? input.pageSize
    : DEFAULT_IMAGE_TO_PDF_OPTIONS.pageSize;
  const orientation = isOrientation(input.orientation)
    ? input.orientation
    : DEFAULT_IMAGE_TO_PDF_OPTIONS.orientation;
  const imageFit = isImageFit(input.imageFit)
    ? input.imageFit
    : DEFAULT_IMAGE_TO_PDF_OPTIONS.imageFit;
  const optimizeFor = isOptimizeFor(input.optimizeFor)
    ? input.optimizeFor
    : DEFAULT_IMAGE_TO_PDF_OPTIONS.optimizeFor;

  const marginMmRaw =
    typeof input.marginMm === "number" ? input.marginMm : DEFAULT_IMAGE_TO_PDF_OPTIONS.marginMm;
  const marginMm = Math.min(40, Math.max(0, marginMmRaw));

  const qualityRaw =
    typeof input.jpegQuality === "number"
      ? input.jpegQuality
      : DEFAULT_IMAGE_TO_PDF_OPTIONS.jpegQuality;
  const jpegQuality = Math.min(1, Math.max(0.5, qualityRaw));

  const ocrEnabled =
    typeof input.ocrEnabled === "boolean" ? input.ocrEnabled : DEFAULT_IMAGE_TO_PDF_OPTIONS.ocrEnabled;
  const ocrLanguages: ImageToPdfOcrLanguages = "eng+ara";

  const filename =
    typeof input.filename === "string"
      ? sanitizeFilename(input.filename)
      : DEFAULT_IMAGE_TO_PDF_OPTIONS.filename;

  return {
    ok: true,
    options: {
      pageSize,
      orientation,
      marginMm,
      imageFit,
      jpegQuality,
      ocrEnabled,
      ocrLanguages,
      filename,
      optimizeFor,
    },
  };
}

