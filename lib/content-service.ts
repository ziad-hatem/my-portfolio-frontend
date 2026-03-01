import React from "react";
import { unstable_cache } from "next/cache";
import {
  getHomeContent,
  getPostContentById,
  getProjectContentById,
  getToolPageSeoBySlug,
  getToolsContent,
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
import { PUBLIC_CONTENT_CACHE_TAGS } from "./public-content-cache-tags";

export interface HomeBundleData {
  home: HomeContentDoc | null;
  projects: { data: ProjectContentDoc[] };
  posts: { data: PostContentDoc[] };
}

const cachedHomeContent = unstable_cache(
  async () => getHomeContent(),
  ["public-content-home"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAGS.all, PUBLIC_CONTENT_CACHE_TAGS.home],
    revalidate: false,
  },
);

const cachedProjectsContent = unstable_cache(
  async () => listProjectsContent(),
  ["public-content-projects"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAGS.all, PUBLIC_CONTENT_CACHE_TAGS.projects],
    revalidate: false,
  },
);

const cachedProjectById = unstable_cache(
  async (id: string) => getProjectContentById(id),
  ["public-content-project-by-id"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAGS.all, PUBLIC_CONTENT_CACHE_TAGS.projects],
    revalidate: false,
  },
);

const cachedPostsContent = unstable_cache(
  async () => listPostsContent(),
  ["public-content-posts"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAGS.all, PUBLIC_CONTENT_CACHE_TAGS.posts],
    revalidate: false,
  },
);

const cachedPostById = unstable_cache(
  async (id: string) => getPostContentById(id),
  ["public-content-post-by-id"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAGS.all, PUBLIC_CONTENT_CACHE_TAGS.posts],
    revalidate: false,
  },
);

const cachedToolsContent = unstable_cache(
  async () => getToolsContent(),
  ["public-content-tools"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAGS.all, PUBLIC_CONTENT_CACHE_TAGS.tools],
    revalidate: false,
  },
);

const cachedToolSeoBySlug = unstable_cache(
  async (slug: string) => getToolPageSeoBySlug(slug),
  ["public-content-tools-by-slug"],
  {
    tags: [PUBLIC_CONTENT_CACHE_TAGS.all, PUBLIC_CONTENT_CACHE_TAGS.tools],
    revalidate: false,
  },
);

export async function getPublicHomeContent(): Promise<HomeContentDoc | null> {
  return cachedHomeContent();
}

export async function getPublicProjectsContent(): Promise<ProjectContentDoc[]> {
  return cachedProjectsContent();
}

export async function getPublicProjectContentById(
  id: string,
): Promise<ProjectContentDoc | null> {
  return cachedProjectById(id);
}

export async function getPublicPostsContent(): Promise<PostContentDoc[]> {
  return cachedPostsContent();
}

export async function getPublicPostContentById(
  id: string,
): Promise<PostContentDoc | null> {
  return cachedPostById(id);
}

export async function getPublicToolsContent(): Promise<ToolsContentDoc | null> {
  return cachedToolsContent();
}

export async function getPublicToolSeoBySlug(
  slug: string,
): Promise<ToolPageSeoEntry | null> {
  return cachedToolSeoBySlug(slug);
}

export async function getHomeBundleData(): Promise<HomeBundleData> {
  const [home, projects, posts] = await Promise.all([
    getPublicHomeContent(),
    getPublicProjectsContent(),
    getPublicPostsContent(),
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
  const projects = await getPublicProjectsContent();
  return {
    entries: {
      data: projects,
    },
  };
}

export async function getProjectEntryData(
  id: string,
): Promise<{ entry: ProjectContentDoc | null }> {
  const project = await getPublicProjectContentById(id);
  return { entry: project };
}

export async function getPostsEntriesData(): Promise<{
  entries: { data: PostContentDoc[] };
}> {
  const posts = await getPublicPostsContent();
  return {
    entries: {
      data: posts,
    },
  };
}

export async function getPostEntryData(
  id: string,
): Promise<{ entry: PostContentDoc | null }> {
  const post = await getPublicPostContentById(id);
  return { entry: post };
}

export async function getToolsSeoData(): Promise<{
  entry: ToolsContentDoc | null;
}> {
  const tools = await getPublicToolsContent();
  return { entry: tools };
}

export async function getToolSeoEntryData(
  slug: string,
): Promise<{ entry: ToolPageSeoEntry | null }> {
  const tool = await getPublicToolSeoBySlug(slug);
  return { entry: tool };
}
