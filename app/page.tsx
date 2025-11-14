import Loading from "@/components/Loading";
import { HomePage } from "@/Cpages/Home Page/HomePage";
import getHomeData from "@/lib/get-data/getHomeData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import { checkIfExist } from "@/lib/checkIfExist";
import { Suspense } from "react";

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

export default async function Home() {
  const homeData = await getHomeData();
  return (
    <Suspense fallback={<Loading />}>
      <HomePage data={homeData} />
    </Suspense>
  );
}
