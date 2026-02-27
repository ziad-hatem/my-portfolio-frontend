import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, ShieldCheck } from "lucide-react";
import { findToolPdfByTokenHash } from "@/lib/tools/image-to-pdf-storage";
import {
  hashShareToken,
  verifySignedShareToken,
} from "@/lib/tools/image-to-pdf-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ token: string }>;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

function toReadableTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString();
}

function isExpired(value: Date | string | number, now: Date): boolean {
  const date = value instanceof Date ? value : new Date(value);
  return date.getTime() <= now.getTime();
}

export default async function ImageToPdfSharePage({ params }: SharePageProps) {
  const { token: tokenParam } = await params;
  const token = decodeURIComponent(tokenParam || "").trim();
  const verified = verifySignedShareToken(token);

  if (!verified.valid || !verified.payload) {
    notFound();
  }

  const record = await findToolPdfByTokenHash(hashShareToken(token));
  if (!record || !record.asset) {
    notFound();
  }

  if (record.asset.assetId !== verified.payload.assetId) {
    notFound();
  }

  const now = new Date();
  const expired =
    Boolean(record.token.revokedAt) ||
    verified.payload.exp * 1000 <= now.getTime() ||
    isExpired(record.token.expiresAt, now) ||
    isExpired(record.asset.expiresAt, now);

  const downloadHref = `/api/tools/image-to-pdf/share/${encodeURIComponent(
    token
  )}/download`;

  return (
    <div className="min-h-screen bg-background px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-border/70 bg-card/80 p-6 md:p-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
          <ShieldCheck size={14} />
          Temporary Share Link
        </div>

        <h1 className="text-3xl font-bold tracking-tight">
          {expired ? "This link has expired" : "Your PDF is ready"}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {expired
            ? "The shared file has reached its retention window or was revoked."
            : "This file is available for a limited time and will be removed automatically."}
        </p>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <dt className="text-muted-foreground">Filename</dt>
            <dd className="mt-1 font-semibold">{record.asset.filename}</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <dt className="text-muted-foreground">Pages</dt>
            <dd className="mt-1 font-semibold">{record.asset.pageCount}</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <dt className="text-muted-foreground">Size</dt>
            <dd className="mt-1 font-semibold">{formatBytes(record.asset.fileSizeBytes)}</dd>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/50 p-3">
            <dt className="text-muted-foreground">Expires</dt>
            <dd className="mt-1 font-semibold">{toReadableTime(record.asset.expiresAt)}</dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-muted-foreground">
          Created: {toReadableTime(record.asset.createdAt)}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!expired ? (
            <a
              href={downloadHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground"
            >
              <FileDown size={16} />
              Download PDF
            </a>
          ) : null}

          <Link
            href="/tools/image-to-pdf"
            className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background/60 px-5 py-3 text-sm font-semibold text-muted-foreground"
          >
            Open Converter
          </Link>
        </div>
      </div>
    </div>
  );
}
