import { NextResponse } from "next/server";
import { getPublicToolsContent } from "@/lib/content-service";

export async function GET() {
  try {
    const tools = await getPublicToolsContent();
    if (!tools) {
      return NextResponse.json(
        { success: false, error: "Tools SEO content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: tools });
  } catch (error) {
    console.error("[Content Tools] Failed to load tools SEO content:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
