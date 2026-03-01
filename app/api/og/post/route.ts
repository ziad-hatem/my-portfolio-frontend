import { NextRequest } from "next/server";
import { getPostContentById } from "@/lib/content-repository";
import {
  ensureLegacyPostOgAsset,
  ensurePostOgAsset,
  getOgAssetByKey,
  getOgImmutableHeaders,
} from "@/lib/og-assets";
import { parseAssetKey } from "@/lib/og-keys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respondWithAsset(request: NextRequest, asset: { buffer: Uint8Array; etag: string }) {
  const headers = getOgImmutableHeaders(asset.etag);
  const ifNoneMatch = request.headers.get("if-none-match");

  if (ifNoneMatch && ifNoneMatch === asset.etag) {
    return new Response(null, {
      status: 304,
      headers,
    });
  }

  const body = new Uint8Array(asset.buffer);

  return new Response(body, {
    status: 200,
    headers,
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedAssetKey = searchParams.get("assetKey");

    if (requestedAssetKey) {
      const cachedAsset = await getOgAssetByKey(requestedAssetKey);
      if (cachedAsset) {
        return respondWithAsset(request, cachedAsset);
      }

      const parsed = parseAssetKey(requestedAssetKey);
      if (parsed?.kind === "post") {
        const post = await getPostContentById(parsed.id);
        if (!post) {
          return new Response("Post not found", { status: 404 });
        }

        const generated = await ensurePostOgAsset({
          assetKey: requestedAssetKey,
          title: post.title,
          image: post.post_image?.permalink || null,
          author: post.author || null,
          baseUrl: request.nextUrl.origin,
        });

        return respondWithAsset(request, generated);
      }
    }

    const title = searchParams.get("title") || "Blog Post";
    const image = searchParams.get("image");
    const author = searchParams.get("author");

    const generated = await ensureLegacyPostOgAsset({
      title,
      image,
      author,
      baseUrl: request.nextUrl.origin,
    });

    return respondWithAsset(request, generated);
  } catch (error) {
    console.error("[OG Post] Failed to generate OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
