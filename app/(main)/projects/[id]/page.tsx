import { SingleProjectPage } from "@/Cpages/Projects Page/Single Project Page/SingleProjectPage";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getProjectById from "@/lib/get-data/getProjectById";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import {
  generateProjectSchema,
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

  const projectData: any = await getProjectById(id);

  const project = checkIfExist(projectData?.entry, null);
  const image = project.project_image.permalink;
  const keywords = [
    project.project_description.split(" "),
    project.project_overview.join(" "),
  ].join(", ");

  // Generate OG image URL with project details
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/api/og/project?title=${encodeURIComponent(
    project.title
  )}&image=${encodeURIComponent(image)}&company=${encodeURIComponent(
    project.company_name || ""
  )}`;
  console.log(ogImageUrl);

  try {
    const metadata = getStaticMetaData({
      title: `${project.title} | Ziad Hatem`,
      description: project.project_description,
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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const projectData: any = await getProjectById(id);

  const project = checkIfExist(projectData?.entry, null);

  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  // Get author name from home data
  const homeData: any = await getHomeData();
  const authorName = checkIfExist(homeData?.home?.name, "Frontend Developer");

  // Generate structured data
  const projectSchema = generateProjectSchema({
    name: project.title,
    description: project.project_description,
    image: project.project_image?.permalink,
    url: `${baseUrl}/projects/${id}`,
    author: authorName,
    keywords: project.skills?.map((skill: any) => skill.skill_name) || [],
  });

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Projects", url: `${baseUrl}/projects` },
    { name: project.title, url: `${baseUrl}/projects/${id}` },
  ]);

  return (
    <>
      <StructuredData data={projectSchema} />
      <StructuredData data={breadcrumbSchema} />
      <SingleProjectPage projectId={id} project={project} />
    </>
  );
}
