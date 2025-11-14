import { ProjectsPage } from "@/Cpages/Projects Page/ProjectsPage";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import getProjectsData from "@/lib/get-data/getProjectsData";
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

export default async function Projects() {
  const projectsData: any = await getProjectsData();
  const projects = checkIfExist(projectsData?.entries?.data, []);

  return <ProjectsPage projects={projects} />;
}
