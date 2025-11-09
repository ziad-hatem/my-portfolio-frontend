import { SingleProjectPage } from "@/Cpages/Projects Page/Single Project Page/SingleProjectPage";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";
export async function generateMetadata() {
  const followIndex = process.env.NEXT_PUBLIC_FOLLOW_INDEX || false;

  try {
    const metadata = getStaticMetaData({
      title: "Ziad Hatem - Frontend Developer",
      description:
        "Front-end developer skilled in React, Next.js, TypeScript, Tailwind CSS and Redux, turning complex requirements into fast, user-centric web apps. I thrive in collaborative environments and stay ahead of industry trends to deliver cutting-edge solutions.",
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
  return <SingleProjectPage projectId={id} />;
}
