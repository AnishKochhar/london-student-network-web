// In: app/api/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getDeletionStatusFromRedis } from "@/app/lib/redis-helpers";

export async function GET(request: NextRequest) {
  try {
    // 1. Get the confirmation code from the URL search parameters.
    // e.g., /api/status?code=your-confirmation-code-here
    const { searchParams } = new URL(request.url);
    const confirmationCode = searchParams.get("code");

    // 2. Validate the input.
    if (!confirmationCode) {
      return NextResponse.json(
        { error: "Confirmation code is required." },
        { status: 400 } // Bad Request
      );
    }

    // 3. Use the helper function to retrieve the status from Redis.
    const status = await getDeletionStatusFromRedis(confirmationCode);

    // 4. Handle the case where the code is not found or has expired.
    if (!status) {
      return NextResponse.json(
        { error: "Invalid or expired confirmation code." },
        { status: 404 } // Not Found
      );
    }

    // 5. If found, return the status object successfully.
    return NextResponse.json(status, { status: 200 });

  } catch (error) {
    console.error("Error in status API route:", error);
    return NextResponse.json(
      { error: "An internal server error occurred." },
      { status: 500 }
    );
  }
}