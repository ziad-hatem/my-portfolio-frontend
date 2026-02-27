import type { Metadata } from "next";
import { getPublicToolSeoBySlug } from "@/lib/content-service";
import getFollowIndex from "@/utils/seo/getFollowIndex";

const FALLBACK_TITLE = "Image to PDF Converter | Fast, Private, Shareable";
const FALLBACK_DESCRIPTION =
  "Convert JPG, PNG, GIF, and HEIC files to PDF with server-first processing, temporary 1-hour share links, and local fallback.";
const FALLBACK_KEYWORDS = [
  "image to pdf",
  "heic to pdf",
  "jpg to pdf",
  "png to pdf",
  "share pdf link",
  "temporary file sharing",
];
const FALLBACK_IMAGE = "/tools/image-to-pdf/opengraph-image";
const FALLBACK_PATH = "/tools/image-to-pdf";

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
    const toolSeo = await getPublicToolSeoBySlug("image-to-pdf");
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
            alt: "Image to PDF converter",
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
    console.error("[Tools image-to-pdf] Failed to generate metadata:", error);
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
            alt: "Image to PDF converter",
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
