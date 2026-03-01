import { SinglePostPage } from "@/Cpages/Posts Page/Single Post/SinglePostPage";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getFollowIndex from "@/utils/seo/getFollowIndex";
import getPostById from "@/lib/get-data/getPostById";
import { checkIfExist } from "@/lib/checkIfExist";
import {
  generateBlogPostSchema,
  generateBreadcrumbSchema,
  StructuredData,
} from "@/utils/seo/structuredData";

function sanitizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toAbsoluteUrl(source: string, baseUrl: string): string {
  try {
    return new URL(source).toString();
  } catch {
    return new URL(source.startsWith("/") ? source : `/${source}`, baseUrl).toString();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const followIndex = getFollowIndex();
  const { id } = await params;

  const postData: any = await getPostById(id);

  const post = checkIfExist(postData?.entry, null);
  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ),
    };
  }

  const seoSettings = post.seo_settings || {};
  const metadataTitle =
    (seoSettings.seo_title || "").trim() || `${post?.title} | Ziad Hatem`;
  const metadataDescription =
    (seoSettings.seo_description || "").trim() ||
    post?.post_text?.substring(0, 160) ||
    "";
  const seoImagePermalink = sanitizeOptionalString(
    seoSettings.seo_image?.permalink
  );
  const legacyOgImagePath = sanitizeOptionalString(post.ogImagePath);
  const postImagePermalink =
    sanitizeOptionalString(post?.post_image?.permalink) || "/cover.jpg";
  const image = seoImagePermalink || postImagePermalink;
  const keywords =
    (seoSettings.seo_keywords || "").trim() ||
    [post?.title, post?.author, post?.post_text].filter(Boolean).join(", ");

  // Generate OG image URL with post details
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const storedOgImage = seoImagePermalink || legacyOgImagePath;
  const ogImageUrl = storedOgImage
    ? toAbsoluteUrl(storedOgImage, baseUrl)
    : `${baseUrl}/api/og/post?title=${encodeURIComponent(
        post?.title || ""
      )}&image=${encodeURIComponent(image || "")}&author=${encodeURIComponent(
        post?.author || ""
      )}`;

  try {
    const metadata = getStaticMetaData({
      title: metadataTitle,
      description: metadataDescription,
      keywords,
      image: ogImageUrl,
      isRobotFollow: followIndex,
    });

    return {
      ...metadata,
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ),
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ),
    };
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const postData: any = await getPostById(id);

  const post = checkIfExist(postData?.entry, null);
  if (!post) {
    return <SinglePostPage postId={id} post={null} />;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const seoImagePermalink = sanitizeOptionalString(
    post?.seo_settings?.seo_image?.permalink
  );
  const postImagePermalink =
    sanitizeOptionalString(post?.post_image?.permalink) || "/cover.jpg";

  // Generate structured data
  const blogPostSchema = generateBlogPostSchema({
    title: post?.title || "",
    description:
      post?.seo_settings?.seo_description ||
      post?.post_text?.substring(0, 160) ||
      "",
    author: post?.author || "Frontend Developer",
    datePublished: post?.publish_date || new Date().toISOString(),
    image: toAbsoluteUrl(seoImagePermalink || postImagePermalink, baseUrl),
    url: `${baseUrl}/posts/${id}`,
  });

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Posts", url: `${baseUrl}/posts` },
    { name: post?.title || "Post", url: `${baseUrl}/posts/${id}` },
  ]);

  return (
    <>
      <StructuredData data={blogPostSchema} />
      <StructuredData data={breadcrumbSchema} />
      <SinglePostPage postId={id} post={post} />
    </>
  );
}
