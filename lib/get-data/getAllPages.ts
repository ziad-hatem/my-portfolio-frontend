import { getPostsEntriesData, getProjectsEntriesData } from "../content-service";

const getAllPages = async () => {
  try {
    const [projectsData, postsData] = await Promise.all([
      getProjectsEntriesData(),
      getPostsEntriesData(),
    ]);
    const projects = projectsData.entries.data;
    const posts = postsData.entries.data;

    return [
      { type: "page", slug: "home", id: "home" },
      { type: "page", slug: "projects", id: "projects" },
      { type: "page", slug: "posts", id: "posts" },
      ...projects.map((project) => ({
        type: "project",
        slug: `projects/${project.id}`,
        id: project.id,
      })),
      ...posts.map((post) => ({
        type: "post",
        slug: `posts/${post.id}`,
        id: post.id,
      })),
    ];
  } catch (error) {
    console.error("[Content] Failed to enumerate pages:", error);
    return [];
  }
};

export default getAllPages;
