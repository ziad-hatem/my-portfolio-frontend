import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

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

function sanitizeFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function pickExtension(file: File): string {
  const fromMime = MIME_EXTENSION_MAP[file.type];
  if (fromMime) {
    return fromMime;
  }

  const parts = file.name.split(".");
  const maybeExtension = parts.length > 1 ? parts.pop() || "" : "";
  const cleaned = maybeExtension.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned || "png";
}

export async function POST(request: NextRequest) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        { success: false, error: "File is required (field name: file)." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(fileEntry.type)) {
      return NextResponse.json(
        { success: false, error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      );
    }

    if (fileEntry.size <= 0) {
      return NextResponse.json(
        { success: false, error: "Uploaded image is empty." },
        { status: 400 }
      );
    }

    if (fileEntry.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image exceeds 10MB limit." },
        { status: 400 }
      );
    }

    const extension = pickExtension(fileEntry);
    const originalBase = fileEntry.name.replace(/\.[^.]+$/, "");
    const safeBase = sanitizeFilename(originalBase) || "image";
    const fileName = `${Date.now()}-${safeBase}-${randomUUID().slice(0, 8)}.${extension}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "admin");
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      data: {
        url: `/uploads/admin/${fileName}`,
      },
    });
  } catch (error) {
    console.error("[Admin Media] Failed to upload image:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
