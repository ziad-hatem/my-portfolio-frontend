import {
  getHomeContent,
  getToolPageSeoBySlug,
  getToolsContent,
  getPostContentById,
  getProjectContentById,
  listPostsContent,
  listProjectsContent,
} from "./content-repository";
import {
  HomeContentDoc,
  PostContentDoc,
  ProjectContentDoc,
  ToolPageSeoEntry,
  ToolsContentDoc,
} from "./content-types";

export interface HomeBundleData {
  home: HomeContentDoc | null;
  projects: { data: ProjectContentDoc[] };
  posts: { data: PostContentDoc[] };
}

export async function getHomeBundleData(): Promise<HomeBundleData> {
  const [home, projects, posts] = await Promise.all([
    getHomeContent(),
    listProjectsContent(),
    listPostsContent(),
  ]);

  return {
    home,
    projects: { data: projects },
    posts: { data: posts },
  };
}

export async function getProjectsEntriesData(): Promise<{
  entries: { data: ProjectContentDoc[] };
}> {
  const projects = await listProjectsContent();
  return {
    entries: {
      data: projects,
    },
  };
}

export async function getProjectEntryData(
  id: string
): Promise<{ entry: ProjectContentDoc | null }> {
  const project = await getProjectContentById(id);
  return { entry: project };
}

export async function getPostsEntriesData(): Promise<{
  entries: { data: PostContentDoc[] };
}> {
  const posts = await listPostsContent();
  return {
    entries: {
      data: posts,
    },
  };
}

export async function getPostEntryData(
  id: string
): Promise<{ entry: PostContentDoc | null }> {
  const post = await getPostContentById(id);
  return { entry: post };
}

export async function getToolsSeoData(): Promise<{
  entry: ToolsContentDoc | null;
}> {
  const tools = await getToolsContent();
  return { entry: tools };
}

export async function getToolSeoEntryData(
  slug: string
): Promise<{ entry: ToolPageSeoEntry | null }> {
  const tool = await getToolPageSeoBySlug(slug);
  return { entry: tool };
}
