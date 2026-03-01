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

function getDuplicateProjectError(error: unknown): string | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as { code?: unknown; keyValue?: unknown };
  if (candidate.code !== 11000) {
    return null;
  }

  if (candidate.keyValue && typeof candidate.keyValue === "object") {
    const keyValue = candidate.keyValue as { id?: unknown };
    if (typeof keyValue.id === "string" && keyValue.id.trim().length > 0) {
      return `Project id '${keyValue.id}' already exists. Use a different id or edit the existing project.`;
    }
  }

  return "Project id already exists. Use a different id or edit the existing project.";
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
      console.error("[Admin Projects] Project created but failed to generate OG image:", ogError);
      warning = "Project created, but OG image generation failed. It will be regenerated on demand.";
    }

    return NextResponse.json(
      warning
        ? { success: true, data: project, warning }
        : { success: true, data: project },
      { status: 201 }
    );
  } catch (error) {
    const duplicateError = getDuplicateProjectError(error);
    if (duplicateError) {
      return NextResponse.json(
        { success: false, error: duplicateError },
        { status: 409 }
      );
    }

    console.error("[Admin Projects] Failed to create project:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
