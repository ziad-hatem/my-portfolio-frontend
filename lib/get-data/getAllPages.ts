import { listPostsContent, listProjectsContent } from "../content-repository";

const getAllPages = async () => {
  try {
    const [projects, posts] = await Promise.all([
      listProjectsContent(),
      listPostsContent(),
    ]);

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
