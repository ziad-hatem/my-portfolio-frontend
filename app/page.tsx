import Loading from "@/components/Loading";
import { HomePage } from "@/Cpages/Home Page/HomePage";
import getHomeData from "@/lib/get-data/getHomeData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import { checkIfExist } from "@/lib/checkIfExist";
import { Suspense } from "react";
import {
  generatePersonSchema,
  generateWebSiteSchema,
  StructuredData,
} from "@/utils/seo/structuredData";

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
  const homeData: any = await getHomeData();
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  // Extract social links for sameAs
  const socialLinks =
    homeData?.home?.social_links?.map((link: any) => link.social_link) || [];

  // Generate structured data
  const personSchema = generatePersonSchema({
    name: checkIfExist(homeData?.home?.name, "Frontend Developer"),
    role: checkIfExist(homeData?.home?.role, "Full Stack Developer"),
    description: checkIfExist(homeData?.home?.description),
    url: baseUrl,
    sameAs: socialLinks,
  });

  const webSiteSchema = generateWebSiteSchema({
    name: checkIfExist(
      homeData?.home?.seo_settings?.seo_title,
      "Frontend Developer Portfolio"
    ),
    description: checkIfExist(
      homeData?.home?.seo_settings?.seo_description,
      "A modern portfolio showcasing frontend development projects and skills"
    ),
    url: baseUrl,
  });

  return (
    <>
      <StructuredData data={personSchema} />
      <StructuredData data={webSiteSchema} />
      <Suspense fallback={<Loading />}>
        <HomePage data={homeData} />
      </Suspense>
    </>
  );
}
