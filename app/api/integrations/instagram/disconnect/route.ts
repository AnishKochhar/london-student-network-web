import { NextResponse } from "next/server";
import { disconnectInstagram, getUserIdFromASUI, storeDeletionStatusInRedis } from "@/app/lib/redis-helpers";
import { disconnectInstagramDB } from "@/app/lib/data";
import { parseSignedRequest } from "@/app/lib/utils";
import crypto from "crypto";

// The function is renamed to POST to handle POST requests.
export async function POST(request: Request) {
  try {
    // 1. Get the 'signed_request' from the incoming POST body.
    // Meta sends this as form data.
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request');

    if (!signedRequest || typeof signedRequest !== 'string') {
        return NextResponse.json({ error: "signed_request not found or is invalid" }, { status: 400 });
    }

    // 2. Use your utility function to parse the request.
    // This function should handle signature verification and return the payload.
    const payload = parseSignedRequest(signedRequest, process.env.INSTAGRAM_APP_SECRET);

    // 3. Check for a valid payload and extract the user_id (AUID).
    if (!payload?.user_id) {
        return NextResponse.json({ error: "Invalid payload or missing user_id" }, { status: 400 });
    }

    const userIdToDelete = payload.user_id; // This is the App-Scoped User ID from Meta.

    // 4. Use the extracted user_id in all your disconnection/deletion functions.
    // The session logic is removed as it's not relevant for this callback.
    const result1 = await disconnectInstagram(userIdToDelete);

    if (!result1.success) {
        return NextResponse.json({ error: "Failed to delete redis connection data." }, { status: 500 });
    }

    const LSNUserId = await getUserIdFromASUI(userIdToDelete);

    if (!LSNUserId) {
        return NextResponse.json({ error: "Failed to identify user. Please contact LSN via email." }, { status: 500 });  
    }

    const result2 = await disconnectInstagramDB(LSNUserId);

    if (!result2.success) {
        return NextResponse.json({ error: "Failed to delete Instagram connection data." }, { status: 500 });
    }

    // 5. Respond in the format required by Meta's callback.
    const confirmationCode = crypto.randomBytes(16).toString('hex');
    const statusURL = `https://www.londonstudentnetwork.com/apps/instagram/data-deletion-status?code=${confirmationCode}`;

    await storeDeletionStatusInRedis(confirmationCode, {
      caseOpenedDate: new Date().toISOString(),
      disconnectionStatus: "Completed",
      dataDeletionStatus: "Not Requested",
    });

    return NextResponse.json({
        url: statusURL,
        confirmation_code: confirmationCode,
    }, { status: 200 });

  } catch (error) {
    console.error("Error processing Meta data deletion callback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
