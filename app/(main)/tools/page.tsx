import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  FileArchive,
  FileStack,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import { getPublicToolsContent } from "@/lib/content-service";
import getFollowIndex from "@/utils/seo/getFollowIndex";

interface ToolItem {
  id: string;
  title: string;
  description: string;
  href: string;
  status: "Live" | "Beta";
  features: string[];
  Icon: LucideIcon;
}

const tools: ToolItem[] = [
  {
    id: "image-to-pdf",
    title: "Image to PDF",
    description:
      "Convert JPG, PNG, GIF, HEIC, and HEIF files into one PDF with drag-and-drop ordering.",
    href: "/tools/image-to-pdf",
    status: "Live",
    features: ["Local Processing", "Reorder Pages", "HEIC Support"],
    Icon: FileStack,
  },
  {
    id: "compress-pdf",
    title: "Compress PDF",
    description:
      "Shrink PDF size in your browser with adjustable compression levels and instant download.",
    href: "/tools/compress-pdf",
    status: "Live",
    features: ["Local Processing", "Compression Profiles", "No Uploads"],
    Icon: FileArchive,
  },
];

const FALLBACK_TOOLS_TITLE = "Developer Tools | Free Browser Utilities";
const FALLBACK_TOOLS_DESCRIPTION =
  "A practical suite of browser-based tools: Image to PDF and PDF compression. Privacy-first with local processing.";
const FALLBACK_TOOLS_KEYWORDS = [
  "developer tools",
  "image to pdf",
  "compress pdf",
  "privacy first tools",
  "browser utilities",
];

function parseKeywords(
  keywords: string | undefined,
  fallback: string[]
): string[] {
  const parsed =
    keywords
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) || [];

  return parsed.length > 0 ? parsed : fallback;
}

export async function generateMetadata(): Promise<Metadata> {
  const followIndex = getFollowIndex();

  try {
    const tools = await getPublicToolsContent();
    const seo = tools?.tools_index_seo;
    const title = seo?.seo_title?.trim() || FALLBACK_TOOLS_TITLE;
    const description = seo?.seo_description?.trim() || FALLBACK_TOOLS_DESCRIPTION;
    const image = seo?.seo_image?.permalink?.trim() || "/tools/opengraph-image";
    const keywords = parseKeywords(seo?.seo_keywords, FALLBACK_TOOLS_KEYWORDS);

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical: "/tools",
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: "/tools",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: "Developer tools collection",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      robots: {
        index: followIndex,
        follow: followIndex,
      },
    };
  } catch (error) {
    console.error("[Tools] Failed to generate metadata:", error);
    return {
      title: FALLBACK_TOOLS_TITLE,
      description: FALLBACK_TOOLS_DESCRIPTION,
      keywords: FALLBACK_TOOLS_KEYWORDS,
      alternates: {
        canonical: "/tools",
      },
      openGraph: {
        title: FALLBACK_TOOLS_TITLE,
        description: FALLBACK_TOOLS_DESCRIPTION,
        type: "website",
        url: "/tools",
        images: [
          {
            url: "/tools/opengraph-image",
            width: 1200,
            height: 630,
            alt: "Developer tools collection",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: FALLBACK_TOOLS_TITLE,
        description: FALLBACK_TOOLS_DESCRIPTION,
        images: ["/tools/opengraph-image"],
      },
      robots: {
        index: followIndex,
        follow: followIndex,
      },
    };
  }
}

export default function ToolsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/2 h-72 w-[52rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-accent"
          >
            <ArrowRight size={14} className="rotate-180" aria-hidden="true" />
            Back to Portfolio
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent">
            <ShieldCheck size={14} aria-hidden="true" />
            Privacy First
          </div>
        </div>

        <section className="mb-10 grid gap-6 rounded-3xl border border-border/70 bg-card/70 p-6 backdrop-blur-xl md:grid-cols-12 md:p-8">
          <div className="md:col-span-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-accent">
              <Sparkles size={12} aria-hidden="true" />
              Fast Utilities
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Build faster with practical tools
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Use browser-native tools built for real daily workflows. No uploads, no tracking,
              and no unnecessary complexity.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="#tool-grid"
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Explore Tools
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <span className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                <Wrench size={15} aria-hidden="true" />
                New tools can be added quickly
              </span>
            </div>
          </div>

          <div className="grid gap-3 md:col-span-4 sm:grid-cols-3 md:grid-cols-1">
            <article className="rounded-2xl border border-border/70 bg-background/65 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tools</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{tools.length}</p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background/65 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Processing</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">Local</p>
            </article>
            <article className="rounded-2xl border border-border/70 bg-background/65 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Data Retention</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">None</p>
            </article>
          </div>
        </section>

        <section id="tool-grid" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group rounded-2xl border border-border/70 bg-card/80 p-5 transition-all duration-300 hover:border-accent/50 hover:translate-y-[-2px]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                  <tool.Icon size={20} aria-hidden="true" />
                </div>
                <span className="rounded-full border border-accent/35 bg-accent/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
                  {tool.status}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-accent">
                {tool.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {tool.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {tool.features.map((feature) => (
                  <span
                    key={`${tool.id}-${feature}`}
                    className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">
                Open Tool
                <ArrowUpRight size={15} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-border/70 bg-card/60 p-5 md:p-6">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Roadmap</p>
          <p className="text-sm text-muted-foreground md:text-base">
            Upcoming utilities will be added here as standalone modules under
            <span className="mx-1 rounded bg-background px-2 py-0.5 font-mono text-foreground">/tools/*</span>
            so each tool stays focused, maintainable, and SEO-friendly.
          </p>
        </section>
      </div>
    </div>
  );
}
