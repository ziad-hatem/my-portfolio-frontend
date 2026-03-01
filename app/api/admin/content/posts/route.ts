import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  createPostContent,
  CreatePostInput,
  listPostsContent,
} from "@/lib/content-repository";
import { ensurePostOgAsset } from "@/lib/og-assets";

function unauthorizedResponse(request: NextRequest) {
  const auth = validateAdminApiKey(request);
  if (auth.valid) {
    return null;
  }

  return NextResponse.json(
    { success: false, error: auth.error },
    { status: auth.status || 401 }
  );
}

function validatePostPayload(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Invalid request body" };
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.title !== "string" || payload.title.trim().length === 0) {
    return { valid: false, error: "Field 'title' is required" };
  }

  if (typeof payload.post_text !== "string" || payload.post_text.trim().length === 0) {
    return { valid: false, error: "Field 'post_text' is required" };
  }

  return { valid: true };
}

export async function GET(request: NextRequest) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const posts = await listPostsContent();
    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("[Admin Posts] Failed to list posts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    const validation = validatePostPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const post = await createPostContent(body as CreatePostInput);

    let warning: string | undefined;
    try {
      await ensurePostOgAsset({
        assetKey: post.ogAssetKey,
        title: post.title,
        image: post.post_image?.permalink || null,
        author: post.author || null,
        baseUrl: request.nextUrl.origin,
      });
    } catch (ogError) {
      console.error("[Admin Posts] Post created but failed to generate OG image:", ogError);
      warning = "Post created, but OG image generation failed. It will be regenerated on demand.";
    }

    return NextResponse.json(
      warning ? { success: true, data: post, warning } : { success: true, data: post },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Admin Posts] Failed to create post:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
