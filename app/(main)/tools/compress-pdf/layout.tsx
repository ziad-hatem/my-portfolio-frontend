import type { Metadata } from "next";
import { getToolPageSeoBySlug } from "@/lib/content-repository";
import getFollowIndex from "@/utils/seo/getFollowIndex";

const FALLBACK_TITLE = "Compress PDF | Reduce File Size Online | Privacy First";
const FALLBACK_DESCRIPTION =
  "Optimize and compress PDF file size directly in your browser. Secure, local processing with no server uploads.";
const FALLBACK_KEYWORDS = [
  "compress pdf",
  "reduce pdf size",
  "optimize pdf",
  "shrink pdf",
  "offline pdf compressor",
  "local pdf compression",
];
const FALLBACK_IMAGE = "/tools/compress-pdf/opengraph-image";
const FALLBACK_PATH = "/tools/compress-pdf";

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
    const toolSeo = await getToolPageSeoBySlug("compress-pdf");
    const seo = toolSeo?.seo_settings;

    const title = seo?.seo_title?.trim() || FALLBACK_TITLE;
    const description = seo?.seo_description?.trim() || FALLBACK_DESCRIPTION;
    const image = seo?.seo_image?.permalink?.trim() || FALLBACK_IMAGE;
    const keywords = parseKeywords(seo?.seo_keywords, FALLBACK_KEYWORDS);
    const canonicalPath = toolSeo?.path?.trim() || FALLBACK_PATH;

    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        type: "website",
        url: canonicalPath,
        siteName: "Frontend Developer Portfolio",
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: "Compress PDF tool",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      alternates: {
        canonical: canonicalPath,
      },
      robots: {
        index: followIndex,
        follow: followIndex,
      },
    };
  } catch (error) {
    console.error("[Tools compress-pdf] Failed to generate metadata:", error);
    return {
      title: FALLBACK_TITLE,
      description: FALLBACK_DESCRIPTION,
      keywords: FALLBACK_KEYWORDS,
      openGraph: {
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        type: "website",
        url: FALLBACK_PATH,
        siteName: "Frontend Developer Portfolio",
        images: [
          {
            url: FALLBACK_IMAGE,
            width: 1200,
            height: 630,
            alt: "Compress PDF tool",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: FALLBACK_TITLE,
        description: FALLBACK_DESCRIPTION,
        images: [FALLBACK_IMAGE],
      },
      alternates: {
        canonical: FALLBACK_PATH,
      },
      robots: {
        index: followIndex,
        follow: followIndex,
      },
    };
  }
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
