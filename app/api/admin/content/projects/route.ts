import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  createProjectContent,
  CreateProjectInput,
  listProjectsContent,
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

function validateProjectPayload(body: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { valid: false, error: "Invalid request body" };
  }

  const payload = body as Record<string, unknown>;
  if (typeof payload.title !== "string" || payload.title.trim().length === 0) {
    return { valid: false, error: "Field 'title' is required" };
  }

  if (
    typeof payload.project_description !== "string" ||
    payload.project_description.trim().length === 0
  ) {
    return { valid: false, error: "Field 'project_description' is required" };
  }

  return { valid: true };
}

export async function GET(request: NextRequest) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const projects = await listProjectsContent();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("[Admin Projects] Failed to list projects:", error);
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
    const validation = validateProjectPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const project = await createProjectContent(body as CreateProjectInput);

    await ensureProjectOgAsset({
      assetKey: project.ogAssetKey,
      title: project.title,
      image: project.project_image?.permalink || null,
      company: project.company_name || null,
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error("[Admin Projects] Failed to create project:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

