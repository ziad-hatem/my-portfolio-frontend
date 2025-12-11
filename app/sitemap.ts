import { MetadataRoute } from "next";

// Revalidate sitemap every hour
export const revalidate = 3600;

async function fetchGraphQL(query: string) {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/graphql`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.error("GraphQL fetch failed:", response.statusText);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error("Error fetching from GraphQL:", error);
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

  // Fetch projects and posts using direct fetch with caching
  const projectsQuery = `
    query {
      entries(site: "default", collection: "projects") {
        data {
          ... on Entry_Projects_Project {
            id
          }
        }
      }
    }
  `;

  const postsQuery = `
    query {
      entries(collection: "posts") {
        data {
          ... on Entry_Posts_Post {
            id
          }
        }
      }
    }
  `;

  const projectsData = await fetchGraphQL(projectsQuery);
  const postsData = await fetchGraphQL(postsQuery);

  const projects = projectsData?.entries?.data || [];
  const posts = postsData?.entries?.data || [];

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
    {
      url: `${baseUrl}/tools/image-to-pdf`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tools/compress-pdf`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // Dynamic project routes
  const projectRoutes: MetadataRoute.Sitemap = projects.map(
    (project: { id: string }) => ({
      url: `${baseUrl}/projects/${project.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })
  );

  // Dynamic post routes
  const postRoutes: MetadataRoute.Sitemap = posts.map((post: { id: string }) => ({
    url: `${baseUrl}/posts/${post.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes, ...postRoutes];
}
