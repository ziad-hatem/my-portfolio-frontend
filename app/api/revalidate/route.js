import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request) {
  if (request.nextUrl.searchParams.get("secret") !== "revalidation-link") {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
  // const path = request.nextUrl.searchParams.get("path");
  // console.log(revalidatePath);

  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
