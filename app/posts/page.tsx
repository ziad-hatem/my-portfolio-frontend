import { PostsPage } from "@/Cpages/Posts Page/PostsPage";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import getPostsData from "@/lib/get-data/getPostsData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";

export async function generateMetadata() {
  const followIndex = process.env.NEXT_PUBLIC_FOLLOW_INDEX || false;
  const homeData: any = await getHomeData();
  try {
    const seoSettings = checkIfExist(homeData?.home?.seo_settings, {});

    const metadata = getStaticMetaData({
      title: checkIfExist(seoSettings?.seo_title),
      description: checkIfExist(seoSettings?.seo_description),
      keywords: checkIfExist(seoSettings?.seo_keywords),
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

export default async function Posts() {
  const postsData: any = await getPostsData();
  const posts = checkIfExist(postsData?.entries?.data, []);

  return <PostsPage posts={posts} />;
}
