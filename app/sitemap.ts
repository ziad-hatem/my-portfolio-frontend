import { MetadataRoute } from "next";
import {
  getToolsContent,
  listPostsContent,
  listProjectsContent,
} from "@/lib/content-repository";

// Revalidate sitemap every hour
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
  const [projects, posts, tools] = await Promise.all([
    listProjectsContent(),
    listPostsContent(),
    getToolsContent(),
  ]);
  const toolPaths = Array.from(
    new Set([
      "/tools/image-to-pdf",
      "/tools/compress-pdf",
      ...(tools?.tool_pages || []).map((entry) => entry.path.trim()),
    ])
  ).filter((path) => path.startsWith("/tools/"));

  // Static routes with high priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const toolRoutes: MetadataRoute.Sitemap = toolPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Dynamic project routes
  const projectRoutes: MetadataRoute.Sitemap = projects.map(
    (project) => ({
      url: `${baseUrl}/projects/${project.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  // Dynamic post routes
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...toolRoutes, ...projectRoutes, ...postRoutes];
}
