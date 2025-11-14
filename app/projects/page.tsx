import { ProjectsPage } from "@/Cpages/Projects Page/ProjectsPage";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import getProjectsData from "@/lib/get-data/getProjectsData";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";

export async function generateMetadata() {
  const followIndex = process.env.NEXT_PUBLIC_FOLLOW_INDEX || false;
  const homeData: any = await getHomeData();
  const projectsData: any = await getProjectsData();
  const projects = checkIfExist(projectsData?.entries?.data, []);

  try {
    const seoSettings = checkIfExist(homeData?.home?.seo_settings, {});

    // Generate keywords from project skills
    const projectKeywords = projects
      .flatMap((project: any) =>
        project.skills?.map((skill: any) => skill.skill_name)
      )
      .filter(Boolean)
      .join(", ");

    const metadata = getStaticMetaData({
      title: `Projects | ${checkIfExist(seoSettings?.seo_title, "Frontend Developer Portfolio")}`,
      description: `Explore my portfolio of ${projects.length} projects showcasing expertise in modern web development, including React, Next.js, TypeScript, and more.`,
      keywords: projectKeywords || checkIfExist(seoSettings?.seo_keywords),
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
      title: "Projects | Frontend Developer Portfolio",
      description: "Explore my portfolio of web development projects.",
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
