import { NextResponse } from "next/server";
import { getPublicHomeContent } from "@/lib/content-service";

export async function GET() {
  try {
    const home = await getPublicHomeContent();
    if (!home) {
      return NextResponse.json(
        { success: false, error: "Home content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: home });
  } catch (error) {
    console.error("[Content Home] Failed to load home content:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
