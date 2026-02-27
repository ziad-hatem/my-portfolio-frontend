import { NextResponse } from "next/server";
import { listPostsContent } from "@/lib/content-repository";

export async function GET() {
  try {
    const posts = await listPostsContent();
    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("[Content Posts] Failed to list posts:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

