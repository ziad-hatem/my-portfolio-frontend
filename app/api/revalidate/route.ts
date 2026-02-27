import { NextRequest, NextResponse } from "next/server";
import { validateAdminApiKey } from "@/lib/admin-auth";
import {
  executeRevalidation,
  resolveRevalidateInput,
} from "@/lib/revalidate-content";

export async function GET(request: NextRequest) {
  const auth = validateAdminApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status || 401 }
    );
  }

  const expectedSecret = process.env.REVALIDATE_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "Server configuration error: REVALIDATE_SECRET is not configured",
      },
      { status: 500 }
    );
  }

  const requestSecret = request.nextUrl.searchParams.get("secret");
  if (!requestSecret || requestSecret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: "Invalid revalidation secret" },
      { status: 401 }
    );
  }

  const resolved = resolveRevalidateInput({
    path: request.nextUrl.searchParams.get("path"),
    type: request.nextUrl.searchParams.get("type"),
    scope: request.nextUrl.searchParams.get("scope"),
  });

  if (!resolved.success) {
    return NextResponse.json(
      { success: false, error: resolved.error },
      { status: resolved.status }
    );
  }

  const result = executeRevalidation(resolved.data);
  return NextResponse.json({ success: true, ...result });
}
