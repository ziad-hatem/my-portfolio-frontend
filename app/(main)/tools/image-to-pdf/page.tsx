
"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  FileDown,
  FileImage,
  GripVertical,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DEFAULT_IMAGE_TO_PDF_OPTIONS,
  type ImageToPdfOptions,
} from "@/lib/tools/image-to-pdf-types";
import { CountUpNumber } from "@/components/ui/CountUpNumber";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  sourceName: string;
}

interface ConversionResult {
  mode: "server" | "local";
  downloadUrl: string;
  shareUrl: string | null;
  expiresAt: string | null;
  pageCount: number;
  fileSizeBytes: number;
  warnings: string[];
}

const FILE_LIMIT = 25;

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
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

function formatCountdown(ms: number): string {
  if (ms <= 0) {
    return "Expired";
  }
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function SortableCard({
  image,
  index,
  onRemove,
}: {
  image: ImageItem;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: image.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-border/60 bg-card"
    >
      <Image src={image.preview} alt={image.sourceName} fill className="object-cover" />
      <div className="absolute left-2 top-2 rounded-md bg-black/55 p-1 text-white/80">
        <GripVertical size={14} />
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(image.id);
        }}
        className="absolute right-2 top-2 rounded-md bg-red-500/90 p-1 text-white opacity-0 transition group-hover:opacity-100"
      >
        <X size={14} />
      </button>
      <div className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-xs text-white">
        {index + 1}
      </div>
    </div>
  );
}

export default function ImageToPdfPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [options, setOptions] = useState<ImageToPdfOptions>({
    ...DEFAULT_IMAGE_TO_PDF_OPTIONS,
    filename: "portfolio-images",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeRequired, setChallengeRequired] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [expiresInMs, setExpiresInMs] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageItem[]>([]);
  const localUrlRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeImage = activeId
    ? images.find((image) => image.id === activeId) || null
    : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const key = "tools:image-to-pdf:fingerprint";
    const existing = sessionStorage.getItem(key);
    if (existing) {
      setFingerprint(existing);
      return;
    }

    const value = createId();
    sessionStorage.setItem(key, value);
    setFingerprint(value);
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (result?.mode === "local") {
      if (localUrlRef.current && localUrlRef.current !== result.downloadUrl) {
        URL.revokeObjectURL(localUrlRef.current);
      }
      localUrlRef.current = result.downloadUrl;
    }
  }, [result]);

  useEffect(() => {
    if (!result?.expiresAt) {
      setExpiresInMs(null);
      return;
    }

    const tick = () => {
      const diff = new Date(result.expiresAt || "").getTime() - Date.now();
      setExpiresInMs(diff);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [result?.expiresAt]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((item) => URL.revokeObjectURL(item.preview));
      if (localUrlRef.current) {
        URL.revokeObjectURL(localUrlRef.current);
      }
    };
  }, []);

  const addFiles = async (incoming: File[]) => {
    setError(null);
    setChallengeRequired(false);

    if (incoming.length === 0) {
      return;
    }

    if (images.length + incoming.length > FILE_LIMIT) {
      toast.error(`Max ${FILE_LIMIT} images per conversion.`);
      return;
    }

    const next: ImageItem[] = [];

    for (const file of incoming) {
      if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) {
        toast.error(`Unsupported file: ${file.name}`);
        continue;
      }

      let processed = file;
      const isHeic =
        /\.(heic|heif)$/i.test(file.name) ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      if (isHeic) {
        const pendingId = toast.loading(`Converting ${file.name}...`);
        try {
          const heic2any = (await import("heic2any")).default;
          const output = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });
          const blob = Array.isArray(output) ? output[0] : output;
          processed = new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
            type: "image/jpeg",
          });
        } catch {
          toast.error(`Failed to process ${file.name}`);
          toast.dismiss(pendingId);
          continue;
        }
        toast.dismiss(pendingId);
      }

      next.push({
        id: createId(),
        file: processed,
        preview: URL.createObjectURL(processed),
        sourceName: file.name,
      });
    }

    if (next.length > 0) {
      setImages((current) => [...current, ...next]);
      setResult(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onInputSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }
    await addFiles(Array.from(event.target.files));
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    await addFiles(Array.from(event.dataTransfer.files || []));
  };

  const onRemove = (id: string) => {
    setImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const clearImages = () => {
    images.forEach((item) => URL.revokeObjectURL(item.preview));
    setImages([]);
    setResult(null);
  };

  const resetAll = () => {
    clearImages();
    setError(null);
    setChallengeRequired(false);
    setTurnstileToken("");
    setShowAdvanced(false);
    setOptions({ ...DEFAULT_IMAGE_TO_PDF_OPTIONS, filename: "portfolio-images" });
    if (localUrlRef.current) {
      URL.revokeObjectURL(localUrlRef.current);
      localUrlRef.current = null;
    }
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((current) => {
        const oldIndex = current.findIndex((item) => item.id === active.id);
        const newIndex = current.findIndex((item) => item.id === over.id);
        return arrayMove(current, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const runLocalFallback = async (): Promise<ConversionResult> => {
    const jsPDF = (await import("jspdf")).default;
    const doc = new jsPDF();
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    for (let i = 0; i < images.length; i += 1) {
      if (i > 0) {
        doc.addPage();
      }

      const source = images[i];
      const img = document.createElement("img");
      img.src = source.preview;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load ${source.sourceName}`));
      });

      const imageRatio = img.width / img.height;
      const pageRatio = width / height;
      let drawWidth = width;
      let drawHeight = height;

      if (imageRatio > pageRatio) {
        drawHeight = width / imageRatio;
      } else {
        drawWidth = height * imageRatio;
      }

      const x = (width - drawWidth) / 2;
      const y = (height - drawHeight) / 2;
      doc.addImage(img, "JPEG", x, y, drawWidth, drawHeight);
    }

    const blob = doc.output("blob");
    const blobUrl = URL.createObjectURL(blob);

    return {
      mode: "local",
      downloadUrl: blobUrl,
      shareUrl: null,
      expiresAt: null,
      pageCount: images.length,
      fileSizeBytes: blob.size,
      warnings: [
        "Server conversion failed, so a local fallback file was generated.",
        "Local mode does not provide share links.",
      ],
    };
  };

  const convertServer = async (): Promise<ConversionResult> => {
    const formData = new FormData();
    images.forEach((item) => formData.append("files[]", item.file, item.file.name));
    formData.append("options", JSON.stringify(options));
    if (turnstileToken.trim()) {
      formData.append("turnstileToken", turnstileToken.trim());
    }

    const response = await fetch("/api/tools/image-to-pdf/convert", {
      method: "POST",
      headers: {
        "x-client-fingerprint": fingerprint || createId(),
      },
      body: formData,
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          success?: boolean;
          error?: string;
          challengeRequired?: boolean;
          shareUrl?: string;
          downloadUrl?: string;
          expiresAt?: string;
          pageCount?: number;
          fileSizeBytes?: number;
          warnings?: string[];
        }
      | null;

    if (!response.ok || !payload?.success) {
      if (response.status === 429 && payload?.challengeRequired) {
        setChallengeRequired(true);
      }

      throw new Error(`${response.status}:${payload?.error || "Conversion failed"}`);
    }

    return {
      mode: "server",
      downloadUrl: payload.downloadUrl || "",
      shareUrl: payload.shareUrl || null,
      expiresAt: payload.expiresAt || null,
      pageCount: payload.pageCount || images.length,
      fileSizeBytes: payload.fileSizeBytes || 0,
      warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
    };
  };

  const doConvert = async () => {
    if (images.length === 0) {
      toast.error("Upload at least one image first.");
      return;
    }

    setIsConverting(true);
    setError(null);
    setChallengeRequired(false);

    try {
      const serverResult = await convertServer();
      setResult(serverResult);
      toast.success("Converted on server.");
      return;
    } catch (errorInstance) {
      const text = errorInstance instanceof Error ? errorInstance.message : "Conversion failed";
      const [statusText, ...rest] = text.split(":");
      const status = Number.parseInt(statusText, 10);
      const message = rest.length > 0 ? rest.join(":") : text;

      if (!Number.isFinite(status) || status >= 500) {
        try {
          const fallbackResult = await runLocalFallback();
          setResult(fallbackResult);
          toast.error("Server unavailable. Local fallback activated.");
          return;
        } catch {
          // Continue to normal error below.
        }
      }

      setError(message || "Conversion failed.");
      toast.error(message || "Conversion failed.");
    } finally {
      setIsConverting(false);
    }
  };

  const copyShareLink = async () => {
    if (!result?.shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success("Share link copied.");
    } catch {
      toast.error("Copy failed.");
    }
  };

  const revokeShareLink = async () => {
    if (!result?.shareUrl) {
      return;
    }

    const revokeUrl = result.downloadUrl.replace(/\/download(?:\?.*)?$/, "");
    const response = await fetch(revokeUrl, {
      method: "DELETE",
      headers: {
        "x-client-fingerprint": fingerprint,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error || "Failed to revoke link.");
      return;
    }

    setResult((current) => (current ? { ...current, shareUrl: null } : current));
    toast.success("Share link revoked.");
  };

  const shareExpired =
    result?.expiresAt !== null && result?.expiresAt !== undefined && expiresInMs !== null
      ? expiresInMs <= 0
      : false;

  return (
    <div className="min-h-screen bg-background px-4 pb-20 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm text-muted-foreground hover:text-accent"
            data-aos="fade-up"
          >
            <ArrowLeft size={16} />
            Back to Tools
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-accent">
            <ShieldCheck size={14} />
            Server + Fallback
          </div>
        </div>

        <section
          className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 p-6 md:p-8"
          data-aos="fade-up"
          data-aos-delay="60"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>

          <div className="relative mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Image to PDF Converter
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
                One clean flow: upload, arrange, convert, and share. Temporary share links expire
                automatically after 1 hour.
              </p>
            </div>

            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/65 px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <RefreshCcw size={16} />
              Reset
            </button>
          </div>

          <div className="relative grid gap-4 md:grid-cols-3">
            <div
              className="rounded-2xl border border-border/60 bg-background/45 p-4"
              data-aos="fade-up"
              data-aos-delay="90"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Images</p>
              <p className="mt-2 text-2xl font-semibold">
                <CountUpNumber value={images.length} duration={0.8} />
              </p>
            </div>
            <div
              className="rounded-2xl border border-border/60 bg-background/45 p-4"
              data-aos="fade-up"
              data-aos-delay="130"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Mode</p>
              <p className="mt-2 text-2xl font-semibold">
                {result?.mode === "local" ? "Local Fallback" : "Server"}
              </p>
            </div>
            <div
              className="rounded-2xl border border-border/60 bg-background/45 p-4"
              data-aos="fade-up"
              data-aos-delay="170"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Max Files</p>
              <p className="mt-2 text-2xl font-semibold">
                <CountUpNumber value={FILE_LIMIT} duration={0.8} />
              </p>
            </div>
          </div>

          {error ? (
            <div className="relative mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          {challengeRequired ? (
            <div className="relative mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm font-semibold text-amber-200">Challenge required</p>
              <p className="mt-1 text-sm text-amber-100/80">
                Too many requests detected. Paste a Turnstile token and retry conversion.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={turnstileToken}
                  onChange={(event) => setTurnstileToken(event.target.value)}
                  placeholder="Turnstile token"
                  className="w-full rounded-xl border border-amber-400/30 bg-background/60 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={doConvert}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-amber-950"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          <div className="relative mt-6 space-y-5" data-aos="fade-up" data-aos-delay="120">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(event) => event.preventDefault()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-border/70 bg-background/40 p-10 text-center transition hover:border-accent/50"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.heic,.heif"
                onChange={onInputSelect}
                className="hidden"
              />
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Upload size={26} />
              </div>
              <p className="mt-4 text-xl font-semibold">Drop images here or click to upload</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add up to {FILE_LIMIT} files, then drag to reorder below.
              </p>
            </div>

            {images.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/45 p-3 text-sm text-muted-foreground">
                  <p>{images.length} image(s) selected. Drag to reorder pages.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-border/70 px-3 py-1.5 hover:text-foreground"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={clearImages}
                      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-red-300"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={images.map((item) => item.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      {images.map((item, index) => (
                        <SortableCard
                          key={item.id}
                          image={item}
                          index={index}
                          onRemove={onRemove}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeImage ? (
                      <div className="relative aspect-[3/4] w-36 overflow-hidden rounded-xl border-2 border-accent shadow-xl">
                        <Image
                          src={activeImage.preview}
                          alt={activeImage.sourceName}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </>
            ) : null}

            <div className="rounded-xl border border-border/60 bg-background/45 p-4 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
                className="rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm"
              >
                {showAdvanced ? "Hide advanced options" : "Show advanced options"}
              </button>

              {showAdvanced ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Filename
                    </span>
                    <input
                      type="text"
                      value={options.filename}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          filename: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Page size
                    </span>
                    <select
                      value={options.pageSize}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          pageSize: event.target.value as ImageToPdfOptions["pageSize"],
                        }))
                      }
                      className="w-full rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm"
                    >
                      <option value="a4">A4</option>
                      <option value="letter">Letter</option>
                      <option value="legal">Legal</option>
                      <option value="fit-image">Fit image</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Orientation
                    </span>
                    <select
                      value={options.orientation}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          orientation: event.target.value as ImageToPdfOptions["orientation"],
                        }))
                      }
                      className="w-full rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm"
                    >
                      <option value="auto">Auto</option>
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Image fit
                    </span>
                    <select
                      value={options.imageFit}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          imageFit: event.target.value as ImageToPdfOptions["imageFit"],
                        }))
                      }
                      className="w-full rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm"
                    >
                      <option value="contain">Contain</option>
                      <option value="cover">Cover</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Margin (mm)
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      step={1}
                      value={options.marginMm}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          marginMm: Number(event.target.value || 0),
                        }))
                      }
                      className="w-full rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      Optimize for
                    </span>
                    <select
                      value={options.optimizeFor}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          optimizeFor: event.target.value as ImageToPdfOptions["optimizeFor"],
                        }))
                      }
                      className="w-full rounded-lg border border-border/70 bg-background/65 px-3 py-2 text-sm"
                    >
                      <option value="screen">Screen</option>
                      <option value="print">Print</option>
                    </select>
                  </label>

                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                      JPEG quality ({options.jpegQuality.toFixed(2)})
                    </span>
                    <input
                      type="range"
                      min={0.5}
                      max={1}
                      step={0.01}
                      value={options.jpegQuality}
                      onChange={(event) =>
                        setOptions((current) => ({
                          ...current,
                          jpegQuality: Number(event.target.value),
                        }))
                      }
                      className="w-full accent-accent"
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/45 p-4">
              <p className="text-sm text-muted-foreground">
                Convert all selected images into one PDF.
              </p>
              <button
                type="button"
                onClick={doConvert}
                disabled={isConverting || images.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground disabled:opacity-55"
              >
                {isConverting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileImage size={16} />
                    Convert Now
                  </>
                )}
              </button>
            </div>

            {result ? (
              <div className="space-y-4 rounded-xl border border-border/60 bg-background/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl font-semibold">PDF Ready</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
                      result.mode === "server"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    {result.mode === "server" ? "Server" : "Local Fallback"}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-lg border border-border/60 bg-card/45 p-3">
                    <p className="text-muted-foreground">Pages</p>
                    <p className="text-lg font-semibold">
                      <CountUpNumber value={result.pageCount} duration={0.8} />
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card/45 p-3">
                    <p className="text-muted-foreground">File size</p>
                    <p className="text-lg font-semibold">{formatBytes(result.fileSizeBytes)}</p>
                  </div>
                </div>

                {result.expiresAt && expiresInMs !== null ? (
                  <p className="text-sm text-muted-foreground">
                    Share link expires in:{" "}
                    <span className={shareExpired ? "text-red-300" : "text-accent"}>
                      {formatCountdown(expiresInMs)}
                    </span>
                  </p>
                ) : null}

                {result.warnings.length > 0 ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                    {result.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={result.downloadUrl}
                    download
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
                  >
                    <FileDown size={16} />
                    Download PDF
                  </a>

                  {result.shareUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={copyShareLink}
                        disabled={shareExpired}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-background/60 px-5 py-2.5 text-sm font-semibold text-muted-foreground disabled:opacity-50"
                      >
                        <Copy size={16} />
                        Copy Share URL
                      </button>
                      <button
                        type="button"
                        onClick={revokeShareLink}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300"
                      >
                        <Trash2 size={16} />
                        Revoke Link
                      </button>
                    </>
                  ) : null}
                </div>

                {result.mode === "server" ? (
                  <p className="text-xs text-muted-foreground">
                    Source files are not stored. Temporary output is auto-deleted after expiry.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
