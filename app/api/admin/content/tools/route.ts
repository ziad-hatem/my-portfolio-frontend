import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  getToolsContent,
  ToolsContentUpdateInput,
  updateToolsContent,
} from "@/lib/content-repository";

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

export async function GET(request: NextRequest) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const tools = await getToolsContent();
    if (!tools) {
      return NextResponse.json(
        { success: false, error: "Tools SEO content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tools });
  } catch (error) {
    console.error("[Admin Tools] Failed to load tools SEO content:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = unauthorizedResponse(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const updated = await updateToolsContent(body as ToolsContentUpdateInput);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Tools SEO content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[Admin Tools] Failed to update tools SEO content:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
