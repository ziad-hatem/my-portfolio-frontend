import { createHash } from "crypto";

export type OgAssetKind = "project" | "post";

export function buildProjectOgAssetKey(
  projectId: string,
  updatedAt: Date
): string {
  return `project:${projectId}:${updatedAt.getTime()}`;
}

export function buildPostOgAssetKey(postId: string, updatedAt: Date): string {
  return `post:${postId}:${updatedAt.getTime()}`;
}

export function buildLegacyOgAssetKey(
  kind: OgAssetKind,
  title: string,
  image: string | null,
  context: string | null
): string {
  const source = JSON.stringify({
    kind,
    title: title || "",
    image: image || "",
    context: context || "",
  });
  const digest = createHash("sha256").update(source).digest("hex");
  return `${kind}:legacy:${digest}`;
}

export function buildProjectOgPath(assetKey: string): string {
  return `/api/og/project?assetKey=${encodeURIComponent(assetKey)}`;
}

export function buildPostOgPath(assetKey: string): string {
  return `/api/og/post?assetKey=${encodeURIComponent(assetKey)}`;
}

export function parseAssetKey(
  assetKey: string
):
  | { kind: "project"; id: string; version: number }
  | { kind: "post"; id: string; version: number }
  | null {
  const projectMatch = assetKey.match(/^project:([^:]+):(\d+)$/);
  if (projectMatch) {
    return {
      kind: "project",
      id: projectMatch[1],
      version: Number(projectMatch[2]),
    };
  }

  const postMatch = assetKey.match(/^post:([^:]+):(\d+)$/);
  if (postMatch) {
    return {
      kind: "post",
      id: postMatch[1],
      version: Number(postMatch[2]),
    };
  }

  return null;
}

