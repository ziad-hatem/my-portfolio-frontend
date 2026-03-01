"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";

interface FormImageFieldProps {
  apiKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  previewAspect?: "auto" | "16:9";
  previewFit?: "cover" | "contain";
}

interface UploadResponse {
  success?: boolean;
  error?: string;
  data?: {
    url?: string;
  };
}

function canPreviewImage(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  );
}

export default function FormImageField({
  apiKey,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  previewAspect = "auto",
  previewFit = "cover",
}: FormImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPickImage = () => {
    fileInputRef.current?.click();
  };

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!apiKey.trim()) {
      setError("Save admin API key first.");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file, file.name);

    let response: Response;
    try {
      response = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
        cache: "no-store",
      });
    } catch {
      setUploading(false);
      setError("Failed to reach upload endpoint.");
      return;
    }

    let payload: UploadResponse | null = null;
    try {
      payload = (await response.json()) as UploadResponse;
    } catch {
      payload = null;
    }

    const uploadedUrl =
      payload?.success && typeof payload?.data?.url === "string"
        ? payload.data.url
        : null;

    if (!response.ok || !uploadedUrl) {
      setUploading(false);
      setError(payload?.error || "Failed to upload image.");
      return;
    }

    onChange(uploadedUrl);
    setUploading(false);
  };

  const showPreview = canPreviewImage(value);
  const previewContainerClassName =
    previewAspect === "16:9"
      ? "w-full overflow-hidden rounded-md border border-border/70 bg-muted aspect-video"
      : "h-20 w-full overflow-hidden rounded-md border border-border/70 bg-muted";
  const previewImageClassName =
    previewFit === "contain"
      ? "h-full w-full object-contain"
      : "h-full w-full object-cover";

  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
      <div className="flex items-center justify-between gap-2">
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        <button
          type="button"
          onClick={onPickImage}
          disabled={uploading}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={12} aria-hidden="true" className="animate-spin" />
          ) : (
            <ImagePlus size={12} aria-hidden="true" />
          )}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          void onUpload(event);
        }}
        className="hidden"
      />

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />

      {showPreview ? (
        <div className={previewContainerClassName}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={`${label} preview`}
            className={previewImageClassName}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
