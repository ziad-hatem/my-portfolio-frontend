import { NextResponse } from "next/server";
import { getPublicPostsContent } from "@/lib/content-service";

export async function GET() {
  try {
    const posts = await getPublicPostsContent();
    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("[Content Posts] Failed to list posts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
