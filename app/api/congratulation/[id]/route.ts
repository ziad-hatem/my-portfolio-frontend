import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import type { CongratulationEntry, GetCongratulationResponse } from "@/types/congratulation";

/**
 * GET /api/congratulation/[id]
 * Retrieve a congratulation entry by ID
 *
 * Path parameter:
 * - id: string - The unique ID of the congratulation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID parameter is required" },
        { status: 400 }
      );
    }

    // Fetch from MongoDB
    const db = await getDatabase();
    const collection = db.collection<CongratulationEntry>("congratulations");

    const entry = await collection.findOne({ id });

    if (!entry) {
      return NextResponse.json(
        { success: false, error: "Congratulation not found" },
        { status: 404 }
      );
    }

    const response: GetCongratulationResponse = {
      success: true,
      data: entry,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching congratulation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as GetCongratulationResponse,
      { status: 500 }
    );
  }
}
