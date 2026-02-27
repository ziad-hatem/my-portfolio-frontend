import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  getHomeContent,
  HomeContentUpdateInput,
  updateHomeContent,
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
    const home = await getHomeContent();
    if (!home) {
      return NextResponse.json(
        { success: false, error: "Home content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: home });
  } catch (error) {
    console.error("[Admin Home] Failed to load home content:", error);
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

    const updated = await updateHomeContent(body as HomeContentUpdateInput);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Home content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[Admin Home] Failed to update home content:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

