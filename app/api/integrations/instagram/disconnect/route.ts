import { NextResponse } from "next/server";
import { disconnectInstagram } from "@/app/lib/redis-helpers";
import { disconnectInstagramDB } from "@/app/lib/data";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    const result1 = await disconnectInstagram(userId);

    if (!result1.success) {
        return NextResponse.json({ error: "Failed to delete redis connection data." }, { status: 500 });
    }

    // Delete long_term_access_token from database
    const result2 = await disconnectInstagramDB(userId);

    if (!result2.success) {
        return NextResponse.json({ error: "Failed to delete Instagram connection data." }, { status: 500 });
    }

    return NextResponse.json({ message: "Succesfully deleted redis and database connection data.", success: true }, { status: 200 });
  } catch (error) {
    console.error("Error disconnecting Instagram:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
