import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  deletePostContent,
  getPostContentById,
  UpdatePostInput,
  updatePostContent,
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

function validatePatchPayload(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Invalid request body" };
  }

  const payload = body as Record<string, unknown>;
  if (Object.keys(payload).length === 0) {
    return { valid: false, error: "Empty patch payload" };
  }

  return { valid: true };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { id } = await params;
    const post = await getPostContentById(id);

    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error) {
    console.error("[Admin Post] Failed to load post:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validatePatchPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const post = await updatePostContent(id, body as UpdatePostInput);
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

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
      console.error("[Admin Post] Post updated but failed to generate OG image:", ogError);
      warning = "Post updated, but OG image generation failed. It will be regenerated on demand.";
    }

    return NextResponse.json(
      warning ? { success: true, data: post, warning } : { success: true, data: post }
    );
  } catch (error) {
    console.error("[Admin Post] Failed to update post:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const { id } = await params;
    const deleted = await deletePostContent(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Post] Failed to delete post:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
