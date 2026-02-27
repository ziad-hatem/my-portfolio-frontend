import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  executeRevalidation,
  resolveRevalidateInput,
} from "@/lib/revalidate-content";

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

export async function POST(request: NextRequest) {
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

    const payload = body as {
      path?: unknown;
      type?: unknown;
      scope?: unknown;
    };

    const resolved = resolveRevalidateInput({
      path: typeof payload.path === "string" ? payload.path : null,
      type: typeof payload.type === "string" ? payload.type : null,
      scope: typeof payload.scope === "string" ? payload.scope : null,
    });

    if (!resolved.success) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const result = executeRevalidation(resolved.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[Admin Revalidate] Failed to revalidate:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
