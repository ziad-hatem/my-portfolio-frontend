export const PUBLIC_CONTENT_CACHE_TAGS = {
  all: "public-content:all",
  home: "public-content:home",
  projects: "public-content:projects",
  posts: "public-content:posts",
  tools: "public-content:tools",
} as const;

export type PublicContentScope = keyof typeof PUBLIC_CONTENT_CACHE_TAGS;

export function isPublicContentScope(
  value: string | null
): value is PublicContentScope {
  return (
    value === "all" ||
    value === "home" ||
    value === "projects" ||
    value === "posts" ||
    value === "tools"
  );
}

export function getPublicContentTagsForScope(scope: PublicContentScope): string[] {
  if (scope === "all") {
    return Object.values(PUBLIC_CONTENT_CACHE_TAGS);
  }

  return [PUBLIC_CONTENT_CACHE_TAGS[scope]];
}
