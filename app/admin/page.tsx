import getStaticMetaData from "@/utils/seo/getStaticMetaData";
import getFollowIndex from "@/utils/seo/getFollowIndex";
import AdminDashboard from "./_components/AdminDashboard";

export async function generateMetadata() {
  const followIndex = getFollowIndex();

  try {
    const metadata = getStaticMetaData({
      title: "Admin",
      description: "Premium admin dashboard for managing home, project, and post content.",
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

export const dynamic = "force-dynamic";

export default function Admin() {
  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(0,245,192,0.12),transparent_40%),radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.1),transparent_36%)]" />
      <div className="relative max-w-7xl mx-auto">
        <AdminDashboard />
      </div>
    </div>
  );
}
