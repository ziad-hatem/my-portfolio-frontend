import type { Metadata } from "next";
import CongratulationPage, {
  CongratulationPageError,
} from "@/Cpages/CongratulationPage/CongratulationPage";
import type { CongratulationEntry } from "@/types/congratulation";
import getStaticMetaData from "@/utils/seo/getStaticMetaData";

/**
 * Fetch congratulation data from API
 */
async function getCongratulationData(id: string): Promise<CongratulationEntry | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/congratulation/${id}`, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error("Error fetching congratulation:", error);
    return null;
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getCongratulationData(id);

  if (!data) {
    return getStaticMetaData({
      title: "Congratulations Page Not Found | Ziad Hatem",
      description: "This congratulations page doesn't exist.",
      isRobotFollow: false,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/api/og/congratulation?id=${id}`;

  const title = `Congratulations ${data.name}! 🎉`;
  const description = data.message
    ? data.message.substring(0, 155)
    : `Celebrating ${data.name}'s achievement! 🎊`;

  return getStaticMetaData({
    title,
    description,
    image: ogImageUrl,
    keywords: `congratulations, ${data.name}, celebration, achievement`,
    isRobotFollow: true,
  });
}

/**
 * Congratulations Page Route
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getCongratulationData(id);

  if (!data) {
    return <CongratulationPageError />;
  }

  return <CongratulationPage data={data} />;
}
