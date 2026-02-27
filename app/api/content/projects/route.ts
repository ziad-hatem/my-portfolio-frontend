import { NextResponse } from "next/server";
import { getPublicProjectsContent } from "@/lib/content-service";

export async function GET() {
  try {
    const projects = await getPublicProjectsContent();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("[Content Projects] Failed to list projects:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
