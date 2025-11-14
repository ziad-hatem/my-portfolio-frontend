import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { nanoid } from "nanoid";
import type { CongratulationEntry, CreateCongratulationResponse } from "@/types/congratulation";

/**
 * POST /api/congratulation
 * Create a new congratulation entry
 *
 * Request body:
 * - password: string (required) - Admin password
 * - name: string (required) - Full name of the person
 * - message?: string - Optional congratulations message
 * - postUrl?: string - Optional LinkedIn post URL
 * - imageUrl?: string - Optional base64 encoded image
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, name, message, postUrl, imageUrl } = body;

    // Validate password
    const adminPassword = process.env.ADMIN_CONGRATS_PASSWORD;
    if (!adminPassword) {
      console.error("ADMIN_CONGRATS_PASSWORD not configured");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: "Name must be less than 100 characters" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message && message.length > 500) {
      return NextResponse.json(
        { success: false, error: "Message must be less than 500 characters" },
        { status: 400 }
      );
    }

    // Validate postUrl format (basic URL validation)
    if (postUrl && !isValidUrl(postUrl)) {
      return NextResponse.json(
        { success: false, error: "Invalid LinkedIn post URL" },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = nanoid(10); // Short, URL-friendly unique ID

    // Create congratulation entry
    const entry: CongratulationEntry = {
      id,
      name: name.trim(),
      message: message?.trim() || undefined,
      postUrl: postUrl?.trim() || undefined,
      imageUrl: imageUrl || undefined,
      createdAt: new Date(),
    };

    // Save to MongoDB
    const db = await getDatabase();
    const collection = db.collection<CongratulationEntry>("congratulations");

    await collection.insertOne(entry);

    // Generate public URL
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
    const publicUrl = `${frontendUrl}/congratulation/${id}`;

    const response: CreateCongratulationResponse = {
      success: true,
      id,
      url: publicUrl,
      message: "Congratulation page created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating congratulation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as CreateCongratulationResponse,
      { status: 500 }
    );
  }
}

/**
 * Basic URL validation
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
