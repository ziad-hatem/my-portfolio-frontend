import { SingleProjectPage } from "@/Cpages/Projects Page/Single Project Page/SingleProjectPage";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getFollowIndex from "@/utils/seo/getFollowIndex";
import getProjectById from "@/lib/get-data/getProjectById";
import { checkIfExist } from "@/lib/checkIfExist";
import getHomeData from "@/lib/get-data/getHomeData";
import {
  generateProjectSchema,
  generateBreadcrumbSchema,
  StructuredData,
} from "@/utils/seo/structuredData";

function sanitizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toAbsoluteUrl(source: string, baseUrl: string): string {
  try {
    return new URL(source).toString();
  } catch {
    return new URL(source.startsWith("/") ? source : `/${source}`, baseUrl).toString();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const followIndex = getFollowIndex();
  const { id } = await params;

  const projectData: any = await getProjectById(id);

  const project = checkIfExist(projectData?.entry, null);
  if (!project) {
    return {
      title: "Project Not Found",
      description: "The requested project could not be found.",
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"
      ),
    };
  }

  const seoSettings = project.seo_settings || {};
  const metadataTitle =
    (seoSettings.seo_title || "").trim() || `${project.title} | Ziad Hatem`;
  const metadataDescription =
    (seoSettings.seo_description || "").trim() || project.project_description;
  const seoImagePermalink = sanitizeOptionalString(
    seoSettings.seo_image?.permalink
  );
  const legacyOgImagePath = sanitizeOptionalString(project.ogImagePath);
  const projectImagePermalink =
    sanitizeOptionalString(project.project_image?.permalink) || "/cover.jpg";
  const image = seoImagePermalink || projectImagePermalink;
  const projectOverview = Array.isArray(project.project_overview)
    ? project.project_overview.join(" ")
    : String(project.project_overview || "");
  const keywords =
    (seoSettings.seo_keywords || "").trim() ||
    [String(project.project_description || ""), projectOverview]
      .filter(Boolean)
      .join(", ");

  // Generate OG image URL with project details
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const storedOgImage = seoImagePermalink || legacyOgImagePath;
  const ogImageUrl = storedOgImage
    ? toAbsoluteUrl(storedOgImage, baseUrl)
    : `${baseUrl}/api/og/project?title=${encodeURIComponent(
        project.title
      )}&image=${encodeURIComponent(image)}&company=${encodeURIComponent(
        project.company_name || ""
      )}`;

  try {
    const metadata = getStaticMetaData({
      title: metadataTitle,
      description: metadataDescription,
      keywords,
      image: ogImageUrl,
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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const projectData: any = await getProjectById(id);

  const project = checkIfExist(projectData?.entry, null);
  if (!project) {
    return <SingleProjectPage projectId={id} project={null} />;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const seoImagePermalink = sanitizeOptionalString(
    project.seo_settings?.seo_image?.permalink
  );
  const projectImagePermalink =
    sanitizeOptionalString(project.project_image?.permalink) || "/cover.jpg";

  // Get author name from home data
  const homeData: any = await getHomeData();
  const authorName = checkIfExist(homeData?.home?.name, "Frontend Developer");

  // Generate structured data
  const projectSchema = generateProjectSchema({
    name: project.title,
    description:
      project.seo_settings?.seo_description || project.project_description,
    image: toAbsoluteUrl(seoImagePermalink || projectImagePermalink, baseUrl),
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
