import { NextRequest } from "next/server";
import { getProjectContentById } from "@/lib/content-repository";
import {
  ensureLegacyProjectOgAsset,
  ensureProjectOgAsset,
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
      if (parsed?.kind === "project") {
        const project = await getProjectContentById(parsed.id);
        if (!project) {
          return new Response("Project not found", { status: 404 });
        }

        const generated = await ensureProjectOgAsset({
          assetKey: requestedAssetKey,
          title: project.title,
          image: project.project_image?.permalink || null,
          company: project.company_name || null,
          baseUrl: request.nextUrl.origin,
        });

        return respondWithAsset(request, generated);
      }
    }

    const title = searchParams.get("title") || "Project";
    const image = searchParams.get("image");
    const company = searchParams.get("company");

    const generated = await ensureLegacyProjectOgAsset({
      title,
      image,
      company,
      baseUrl: request.nextUrl.origin,
    });

    return respondWithAsset(request, generated);
  } catch (error) {
    console.error("[OG Project] Failed to generate OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
