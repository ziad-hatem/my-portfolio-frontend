import { revalidatePath, revalidateTag } from "next/cache";
import {
  getPublicContentTagsForScope,
  isPublicContentScope,
  type PublicContentScope,
} from "@/lib/public-content-cache-tags";

export type RevalidateRouteType = "page" | "layout";

export interface RevalidateInput {
  path: string | null | undefined;
  type: string | null | undefined;
  scope: string | null | undefined;
}

export interface RevalidateResolvedInput {
  path: string;
  type: RevalidateRouteType;
  scope: PublicContentScope;
  tags: string[];
}

type RevalidateValidationResult =
  | { success: true; data: RevalidateResolvedInput }
  | { success: false; status: number; error: string };

function isValidRevalidateType(
  value: string | null | undefined
): value is RevalidateRouteType {
  return value === "page" || value === "layout";
}

export function resolveRevalidateInput({
  path,
  type,
  scope,
}: RevalidateInput): RevalidateValidationResult {
  const normalizedPath = (path || "/").trim() || "/";
  if (!normalizedPath.startsWith("/")) {
    return {
      success: false,
      status: 400,
      error: "Invalid path parameter",
    };
  }

  const normalizedType: RevalidateRouteType = isValidRevalidateType(type)
    ? type
    : "page";

  const scopeCandidate = scope ?? null;
  const normalizedScope: PublicContentScope = isPublicContentScope(scopeCandidate)
    ? scopeCandidate
    : "all";

  return {
    success: true,
    data: {
      path: normalizedPath,
      type: normalizedType,
      scope: normalizedScope,
      tags: getPublicContentTagsForScope(normalizedScope),
    },
  };
}

export function executeRevalidation(input: RevalidateResolvedInput) {
  for (const tag of input.tags) {
    revalidateTag(tag, "max");
  }

  revalidatePath(input.path, input.type);

  return {
    revalidated: true,
    path: input.path,
    type: input.type,
    scope: input.scope,
    tags: input.tags,
    timestamp: new Date().toISOString(),
  };
}
