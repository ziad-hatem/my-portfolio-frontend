import { SinglePostPage } from "@/Cpages/Posts Page/Single Post/SinglePostPage";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getPostById from "@/lib/get-data/getPostById";
import { checkIfExist } from "@/lib/checkIfExist";
import {
  generateBlogPostSchema,
  generateBreadcrumbSchema,
  StructuredData,
} from "@/utils/seo/structuredData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const followIndex = process.env.NEXT_PUBLIC_FOLLOW_INDEX || false;
  const { id } = await params;

  const postData: any = await getPostById(id);

  const post = checkIfExist(postData?.entry, null);
  post;

  const image = post?.post_image?.permalink;
  const keywords = [post?.title, post.post_text].join(", ");

  // Generate OG image URL with post details
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/api/og/post?title=${encodeURIComponent(
    post?.title || ""
  )}&image=${encodeURIComponent(image || "")}&author=${encodeURIComponent(
    post?.author || ""
  )}`;
  ogImageUrl;

  try {
    const metadata = getStaticMetaData({
      title: `${post?.title} | Ziad Hatem`,
      description: post?.post_text?.substring(0, 160) || "",
      keywords,
      image: ogImageUrl,
      isRobotFollow: followIndex as boolean,
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

  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  // Generate structured data
  const blogPostSchema = generateBlogPostSchema({
    title: post?.title || "",
    description: post?.post_text?.substring(0, 160) || "",
    author: post?.author || "Frontend Developer",
    datePublished: post?.publish_date || new Date().toISOString(),
    image: post?.post_image?.permalink,
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
