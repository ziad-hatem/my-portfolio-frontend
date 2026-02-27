import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import {
  ImageToPdfConvertResult,
  ImageToPdfOptions,
  ToolLimits,
} from "./image-to-pdf-types";

const MM_TO_POINTS = 2.83464567;
const PX_TO_POINTS = 0.75;

const MAX_INPUT_DIMENSION = 14000;
const MAX_INPUT_PIXELS = 120_000_000;

const PAGE_SIZES_MM = {
  a4: { width: 210, height: 297 },
  letter: { width: 216, height: 279 },
  legal: { width: 216, height: 356 },
};

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/heic-sequence": "image/heic",
  "image/heif-sequence": "image/heif",
};

const EXTENSION_TO_MIME: Record<string, string[]> = {
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  bmp: ["image/bmp"],
  tif: ["image/tiff"],
  tiff: ["image/tiff"],
  heic: ["image/heic", "image/heif"],
  heif: ["image/heif", "image/heic"],
};

const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"],
  "image/bmp": ["bmp"],
  "image/tiff": ["tif", "tiff"],
  "image/heic": ["heic", "heif"],
  "image/heif": ["heif", "heic"],
};

interface LoadedImage {
  name: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
}

interface ProcessedImage {
  name: string;
  mimeType: string;
  buffer: Buffer;
  width: number;
  height: number;
}

interface ConversionFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ImageToPdfError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function normalizeMimeType(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim().toLowerCase();
  return MIME_ALIASES[normalized] || normalized;
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1) {
    return "";
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

function sniffMimeType(buffer: Buffer): string | null {
  if (buffer.length < 12) {
    return null;
  }

  const isJpeg =
    buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) {
    return "image/jpeg";
  }

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;
  if (isPng) {
    return "image/png";
  }

  const isGif =
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38;
  if (isGif) {
    return "image/gif";
  }

  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (isWebp) {
    return "image/webp";
  }

  const isBmp = buffer[0] === 0x42 && buffer[1] === 0x4d;
  if (isBmp) {
    return "image/bmp";
  }

  const isTiffLittle =
    buffer[0] === 0x49 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x2a &&
    buffer[3] === 0x00;
  const isTiffBig =
    buffer[0] === 0x4d &&
    buffer[1] === 0x4d &&
    buffer[2] === 0x00 &&
    buffer[3] === 0x2a;
  if (isTiffLittle || isTiffBig) {
    return "image/tiff";
  }

  const hasFtyp = buffer.subarray(4, 8).toString("ascii") === "ftyp";
  if (hasFtyp) {
    const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    const heifBrands = new Set([
      "heic",
      "heix",
      "hevc",
      "hevx",
      "heim",
      "heis",
      "hevm",
      "hevs",
      "mif1",
      "msf1",
    ]);
    if (heifBrands.has(brand)) {
      return "image/heic";
    }
  }

  return null;
}

function assertFileContract(
  fileName: string,
  declaredMimeType: string,
  sniffedMimeType: string
): void {
  if (declaredMimeType && !declaredMimeType.startsWith("image/")) {
    throw new ImageToPdfError(
      `Unsupported file type for "${fileName}".`,
      400
    );
  }

  if (declaredMimeType && declaredMimeType !== sniffedMimeType) {
    const declaredVariants = new Set([declaredMimeType]);
    const sniffedVariants = new Set([sniffedMimeType]);

    if (declaredMimeType === "image/heif" || declaredMimeType === "image/heic") {
      declaredVariants.add("image/heic");
      declaredVariants.add("image/heif");
    }
    if (sniffedMimeType === "image/heif" || sniffedMimeType === "image/heic") {
      sniffedVariants.add("image/heic");
      sniffedVariants.add("image/heif");
    }

    const hasOverlap = [...declaredVariants].some((value) =>
      sniffedVariants.has(value)
    );
    if (!hasOverlap) {
      throw new ImageToPdfError(
        `MIME mismatch for "${fileName}".`,
        400
      );
    }
  }

  const extension = getExtension(fileName);
  if (!extension) {
    return;
  }

  const allowedFromMime = MIME_TO_EXTENSIONS[sniffedMimeType];
  if (!allowedFromMime || !allowedFromMime.includes(extension)) {
    throw new ImageToPdfError(
      `File extension mismatch for "${fileName}".`,
      400
    );
  }

  const allowedFromExtension = EXTENSION_TO_MIME[extension];
  if (!allowedFromExtension || !allowedFromExtension.includes(sniffedMimeType)) {
    throw new ImageToPdfError(
      `Unsupported extension for "${fileName}".`,
      400
    );
  }
}

function ensureAllowedDimensions(
  fileName: string,
  width: number,
  height: number
): void {
  if (width <= 0 || height <= 0) {
    throw new ImageToPdfError(`Invalid image dimensions for "${fileName}".`, 400);
  }

  if (width > MAX_INPUT_DIMENSION || height > MAX_INPUT_DIMENSION) {
    throw new ImageToPdfError(
      `Image "${fileName}" dimensions are too large.`,
      413
    );
  }

  if (width * height > MAX_INPUT_PIXELS) {
    throw new ImageToPdfError(
      `Image "${fileName}" exceeds the maximum pixel limit.`,
      413
    );
  }
}

function getTargetMaxDimension(options: ImageToPdfOptions): number {
  return options.optimizeFor === "print" ? 5200 : 3600;
}

async function loadAndValidateFiles(
  files: File[],
  limits: ToolLimits
): Promise<LoadedImage[]> {
  if (files.length === 0) {
    throw new ImageToPdfError("At least one image is required.", 400);
  }

  if (files.length > limits.maxFiles || files.length > limits.maxPages) {
    throw new ImageToPdfError(
      `Too many files. Maximum allowed is ${Math.min(
        limits.maxFiles,
        limits.maxPages
      )}.`,
      400
    );
  }

  const maxFileBytes = limits.maxFileMb * 1024 * 1024;
  const maxTotalBytes = limits.maxTotalMb * 1024 * 1024;
  let totalBytes = 0;

  const loaded: LoadedImage[] = [];
  for (const file of files) {
    if (!file || typeof file.arrayBuffer !== "function") {
      throw new ImageToPdfError("Invalid file payload.", 400);
    }

    if (file.size <= 0) {
      throw new ImageToPdfError(`File "${file.name}" is empty.`, 400);
    }

    if (file.size > maxFileBytes) {
      throw new ImageToPdfError(
        `File "${file.name}" exceeds ${limits.maxFileMb}MB.`,
        413
      );
    }

    totalBytes += file.size;
    if (totalBytes > maxTotalBytes) {
      throw new ImageToPdfError(
        `Total upload size exceeds ${limits.maxTotalMb}MB.`,
        413
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffedMimeType = sniffMimeType(buffer);
    if (!sniffedMimeType) {
      buffer.fill(0);
      throw new ImageToPdfError(
        `Unsupported image format for "${file.name}".`,
        400
      );
    }

    const declaredMimeType = normalizeMimeType(file.type);
    assertFileContract(file.name, declaredMimeType, sniffedMimeType);

    loaded.push({
      name: file.name,
      mimeType: sniffedMimeType,
      buffer,
      size: file.size,
    });
  }

  return loaded;
}

async function processImage(
  input: LoadedImage,
  options: ImageToPdfOptions,
  warnings: string[]
): Promise<ProcessedImage> {
  const maxDimension = getTargetMaxDimension(options);
  const quality = Math.round(
    (options.optimizeFor === "print"
      ? Math.max(options.jpegQuality, 0.84)
      : options.jpegQuality) * 100
  );

  try {
    const base = sharp(input.buffer, {
      limitInputPixels: MAX_INPUT_PIXELS,
      animated: false,
    }).rotate();

    const metadata = await base.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    ensureAllowedDimensions(input.name, width, height);

    let pipeline = base;
    if (width > maxDimension || height > maxDimension) {
      pipeline = pipeline.resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      });
      warnings.push(
        `Image "${input.name}" was resized to improve conversion reliability.`
      );
    }

    const { data, info } = await pipeline
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
        chromaSubsampling: "4:2:0",
      })
      .toBuffer({ resolveWithObject: true });

    const outWidth = info.width || width;
    const outHeight = info.height || height;
    ensureAllowedDimensions(input.name, outWidth, outHeight);

    return {
      name: input.name,
      mimeType: "image/jpeg",
      buffer: data,
      width: outWidth,
      height: outHeight,
    };
  } catch (error) {
    if (error instanceof ImageToPdfError) {
      throw error;
    }

    throw new ImageToPdfError(
      `Failed to normalize "${input.name}" for conversion.`,
      422
    );
  } finally {
    // Source files are never persisted.
    input.buffer.fill(0);
  }
}

function buildPageSize(
  options: ImageToPdfOptions,
  imageWidth: number,
  imageHeight: number
): { width: number; height: number } {
  const margin = Math.max(0, options.marginMm) * MM_TO_POINTS;

  if (options.pageSize === "fit-image") {
    let pageWidth = imageWidth * PX_TO_POINTS + margin * 2;
    let pageHeight = imageHeight * PX_TO_POINTS + margin * 2;

    if (options.orientation === "portrait" && pageWidth > pageHeight) {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }
    if (options.orientation === "landscape" && pageHeight > pageWidth) {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    return {
      width: pageWidth,
      height: pageHeight,
    };
  }

  const base = PAGE_SIZES_MM[options.pageSize];
  let width = base.width * MM_TO_POINTS;
  let height = base.height * MM_TO_POINTS;

  const shouldLandscape =
    options.orientation === "landscape" ||
    (options.orientation === "auto" && imageWidth > imageHeight);

  if (shouldLandscape && width < height) {
    [width, height] = [height, width];
  }

  if (!shouldLandscape && options.orientation === "portrait" && width > height) {
    [width, height] = [height, width];
  }

  return { width, height };
}

function buildImageFrame(
  pageWidth: number,
  pageHeight: number,
  imageWidth: number,
  imageHeight: number,
  options: ImageToPdfOptions
): ConversionFrame {
  const margin = Math.max(0, options.marginMm) * MM_TO_POINTS;
  const safeMargin = Math.min(margin, Math.min(pageWidth, pageHeight) / 4);

  const innerWidth = Math.max(1, pageWidth - safeMargin * 2);
  const innerHeight = Math.max(1, pageHeight - safeMargin * 2);
  const imageRatio = imageWidth / imageHeight;
  const innerRatio = innerWidth / innerHeight;

  let width = innerWidth;
  let height = innerHeight;

  const useContain = options.imageFit === "contain";
  if (useContain) {
    if (imageRatio > innerRatio) {
      height = innerWidth / imageRatio;
    } else {
      width = innerHeight * imageRatio;
    }
  } else {
    if (imageRatio > innerRatio) {
      width = innerHeight * imageRatio;
    } else {
      height = innerWidth / imageRatio;
    }
  }

  const x = (pageWidth - width) / 2;
  const y = (pageHeight - height) / 2;

  return { x, y, width, height };
}

export async function convertImageFilesToPdf(
  files: File[],
  options: ImageToPdfOptions,
  limits: ToolLimits
): Promise<ImageToPdfConvertResult> {
  const warnings: string[] = [];
  if (options.ocrEnabled) {
    warnings.push("OCR is currently disabled for reliability. Conversion continued without OCR.");
  }

  const loadedImages = await loadAndValidateFiles(files, limits);
  const processedImages: ProcessedImage[] = [];

  try {
    for (const image of loadedImages) {
      const processed = await processImage(image, options, warnings);
      processedImages.push(processed);
    }

    const pdfDoc = await PDFDocument.create();

    for (const image of processedImages) {
      const pageSize = buildPageSize(options, image.width, image.height);
      const page = pdfDoc.addPage([pageSize.width, pageSize.height]);
      const frame = buildImageFrame(
        pageSize.width,
        pageSize.height,
        image.width,
        image.height,
        options
      );

      const embeddedImage = await pdfDoc.embedJpg(image.buffer);
      page.drawImage(embeddedImage, frame);
    }

    const bytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    return {
      buffer: Buffer.from(bytes),
      pageCount: processedImages.length,
      ocrApplied: false,
      warnings,
    };
  } finally {
    for (const image of loadedImages) {
      image.buffer.fill(0);
    }

    for (const image of processedImages) {
      image.buffer.fill(0);
    }
  }
}
