import { ContactPage } from "@/Cpages/ContactPage/ContactPage";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getFollowIndex from "@/utils/seo/getFollowIndex";

export async function generateMetadata() {
  const followIndex = getFollowIndex();
  const homeData: any = await getHomeData();
  try {
    const seoSettings = checkIfExist(homeData?.home?.seo_settings, {});

    const metadata = getStaticMetaData({
      title: checkIfExist(seoSettings?.seo_title),
      description: checkIfExist(seoSettings?.seo_description),
      keywords: checkIfExist(seoSettings?.seo_keywords),
      image: checkIfExist(seoSettings?.seo_image?.permalink, "/cover.jpg"),
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

export default function Contact() {
  return <ContactPage />;
}
