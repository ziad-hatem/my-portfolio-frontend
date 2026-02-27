import { NextResponse } from "next/server";
import { listProjectsContent } from "@/lib/content-repository";

export async function GET() {
  try {
    const projects = await listProjectsContent();
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error("[Content Projects] Failed to list projects:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

