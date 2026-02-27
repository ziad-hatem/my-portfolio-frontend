import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  getPublicContentTagsForScope,
  isPublicContentScope,
} from "@/lib/public-content-cache-tags";

function isValidRevalidateType(value: string | null): value is "page" | "layout" {
  return value === "page" || value === "layout";
}

export async function GET(request: NextRequest) {
  const auth = validateAdminApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status || 401 }
    );
  }

  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Server configuration error: REVALIDATE_SECRET is not configured",
      },
      { status: 500 }
    );
  }

  const requestSecret = request.nextUrl.searchParams.get("secret");
  if (!requestSecret || requestSecret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: "Invalid revalidation secret" },
      { status: 401 }
    );
  }

  const path = request.nextUrl.searchParams.get("path") || "/";
  if (!path.startsWith("/")) {
    return NextResponse.json(
      { success: false, error: "Invalid path parameter" },
      { status: 400 }
    );
  }

  const revalidateType = request.nextUrl.searchParams.get("type");
  const type = isValidRevalidateType(revalidateType) ? revalidateType : "page";
  const scopeParam = request.nextUrl.searchParams.get("scope");
  const scope = isPublicContentScope(scopeParam) ? scopeParam : "all";
  const tags = getPublicContentTagsForScope(scope);

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  revalidatePath(path, type);
  return NextResponse.json({
    success: true,
    revalidated: true,
    path,
    type,
    scope,
    tags,
    timestamp: new Date().toISOString(),
  });
}
