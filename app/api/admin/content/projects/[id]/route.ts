import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  deleteProjectContent,
  getProjectContentById,
  UpdateProjectInput,
  updateProjectContent,
} from "@/lib/content-repository";
import { ensureProjectOgAsset } from "@/lib/og-assets";

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
    const project = await getProjectContentById(id);

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("[Admin Project] Failed to load project:", error);
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

    const project = await updateProjectContent(id, body as UpdateProjectInput);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    let warning: string | undefined;
    try {
      await ensureProjectOgAsset({
        assetKey: project.ogAssetKey,
        title: project.title,
        image: project.project_image?.permalink || null,
        company: project.company_name || null,
        baseUrl: request.nextUrl.origin,
      });
    } catch (ogError) {
      console.error("[Admin Project] Project updated but failed to generate OG image:", ogError);
      warning = "Project updated, but OG image generation failed. It will be regenerated on demand.";
    }

    return NextResponse.json(
      warning
        ? { success: true, data: project, warning }
        : { success: true, data: project }
    );
  } catch (error) {
    console.error("[Admin Project] Failed to update project:", error);
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
    const deleted = await deleteProjectContent(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Project] Failed to delete project:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
