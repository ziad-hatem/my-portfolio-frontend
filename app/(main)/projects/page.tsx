import { ProjectsPage } from "@/Cpages/Projects Page/ProjectsPage";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import getProjectsData from "@/lib/get-data/getProjectsData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getFollowIndex from "@/utils/seo/getFollowIndex";

export async function generateMetadata() {
  const followIndex = getFollowIndex();
  const homeData: any = await getHomeData();
  const projectsData: any = await getProjectsData();
  const projects = checkIfExist(projectsData?.entries?.data, []);

  try {
    const seoSettings = checkIfExist(homeData?.home?.seo_settings, {});

    // Generate keywords from project skills (max 5 projects to prevent keyword stuffing)
    const projectKeywords = projects
      .slice(0, 5)
      .flatMap((project: any) =>
        project.skills?.map((skill: any) => skill.skill_name),
      )
      .filter(Boolean)
      .join(", ");

    const metadata = getStaticMetaData({
      title: `Projects | ${checkIfExist(seoSettings?.seo_title, "Frontend Developer Portfolio")}`,
      description: `Explore my portfolio of ${projects.length} projects showcasing expertise in modern web development, including React, Next.js, TypeScript, and more.`,
      keywords: projectKeywords || checkIfExist(seoSettings?.seo_keywords),
      image: checkIfExist(seoSettings?.seo_image?.permalink, "/cover.jpg"),
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
      title: "Projects | Frontend Developer Portfolio",
      description: "Explore my portfolio of web development projects.",
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000",
      ),
    };
  }
}

export default async function Projects() {
  const projectsData: any = await getProjectsData();
  const projects = checkIfExist(projectsData?.entries?.data, []);

  return <ProjectsPage projects={projects} />;
}
