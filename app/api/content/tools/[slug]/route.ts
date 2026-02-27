import { NextRequest, NextResponse } from "next/server";
import { getPublicToolSeoBySlug } from "@/lib/content-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const toolSeo = await getPublicToolSeoBySlug(slug);

    if (!toolSeo) {
      return NextResponse.json(
        { success: false, error: "Tool SEO content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: toolSeo });
  } catch (error) {
    console.error("[Content Tool] Failed to load tool SEO content:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
