import { NextRequest, NextResponse } from "next/server";
import { getToolPageSeoBySlug } from "@/lib/content-repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const toolSeo = await getToolPageSeoBySlug(slug);

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
