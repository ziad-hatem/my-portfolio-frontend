import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, itemId, itemTitle, ipAddress, locationData } = body;

    if (!type || !itemId || !itemTitle) {
      return NextResponse.json(
        { error: "Missing required fields: type, itemId, itemTitle" },
        { status: 400 }
      );
    }

    if (type !== "project" && type !== "post") {
      return NextResponse.json(
        { error: 'Type must be "project" or "post"' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const viewsCollection = db.collection("views");
    const viewDetailsCollection = db.collection("view_details");

    // Store detailed view with IP and location
    await viewDetailsCollection.insertOne({
      type,
      itemId,
      itemTitle,
      ipAddress: ipAddress || null,
      locationData: locationData || null,
      timestamp: new Date(),
      createdAt: new Date(),
    });

    // Upsert view count
    await viewsCollection.updateOne(
      { type, itemId },
      {
        $inc: { count: 1 },
        $set: {
          itemTitle,
          lastViewedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Get updated count
    const viewDoc = await viewsCollection.findOne({ type, itemId });
    const locationStr = locationData
      ? `from ${locationData.city}, ${locationData.country} (${ipAddress})`
      : ipAddress
      ? `from IP ${ipAddress}`
      : "";

    `👁️ Incremented ${type} view for ${itemTitle} (${itemId}) ${locationStr} - Total: ${
      viewDoc?.count || 1
    }`;

    return NextResponse.json({
      success: true,
      count: viewDoc?.count || 1,
      message: "View counted successfully",
    });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to increment view count: ${errorMessage}` },
      { status: 500 }
    );
  }
}
