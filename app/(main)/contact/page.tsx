import { ContactPage } from "@/Cpages/ContactPage/ContactPage";
import getHomeData from "@/lib/get-data/getHomeData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getFollowIndex from "@/utils/seo/getFollowIndex";

export async function generateMetadata() {
  const followIndex = getFollowIndex();
  try {
    const metadata = getStaticMetaData({
      title: "Contact | Ziad Hatem",
      description:
        "Get in touch to discuss projects, collaborations, or freelance work.",
      isRobotFollow: followIndex,
    });

    return {
      ...metadata,
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
      ),
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Contact | Ziad Hatem",
      description:
        "Get in touch to discuss projects, collaborations, or freelance work.",
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
      ),
    };
  }
}

export default async function Contact() {
  // Fetch homeData here to pass social links to the ContactPage
  const homeData: any = await getHomeData();
  const socialLinks = homeData?.home?.social_links || [];

  return <ContactPage socialLinks={socialLinks} />;
}
