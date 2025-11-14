import { PostsPage } from "@/Cpages/Posts Page/PostsPage";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import getPostsData from "@/lib/get-data/getPostsData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";

export async function generateMetadata() {
  const followIndex = process.env.NEXT_PUBLIC_FOLLOW_INDEX || false;
  const homeData: any = await getHomeData();
  const postsData: any = await getPostsData();
  const posts = checkIfExist(postsData?.entries?.data, []);

  try {
    const seoSettings = checkIfExist(homeData?.home?.seo_settings, {});

    // Generate keywords from post titles
    const postKeywords = posts
      .map((post: any) => post.title)
      .filter(Boolean)
      .join(", ");

    const metadata = getStaticMetaData({
      title: `Blog Posts | ${checkIfExist(seoSettings?.seo_title, "Frontend Developer Portfolio")}`,
      description: `Read my latest ${posts.length} blog posts about web development, programming, React, Next.js, and frontend technologies.`,
      keywords: postKeywords || checkIfExist(seoSettings?.seo_keywords),
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
      title: "Blog Posts | Frontend Developer Portfolio",
      description: "Read my latest blog posts about web development.",
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ),
    };
  }
}

export default async function Posts() {
  const postsData: any = await getPostsData();
  const posts = checkIfExist(postsData?.entries?.data, []);

  return <PostsPage posts={posts} />;
}
