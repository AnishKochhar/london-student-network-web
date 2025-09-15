// import { storeInstagramToken, addUserToPollingList } from "@/lib/redis-helpers"
import { storeInstagramTokenInRedis, addUserToPollingList } from "@/app/lib/redis-helpers"
import { storeInstagramTokenInDatabase } from "@/app/lib/data"
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { code, redirect_uri } = await request.json()
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user?.role !== "organiser") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("THIS IS THE REDIRECT URI!!!", redirect_uri)

    const userId = session.user?.id;
    const name = session.user?.name;

    if (!code) {
      return NextResponse.json({ error: "Authorization code is missing." }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "Please try again later. If the problem persists, contact us." }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Please try again later. If the problem persists, contact us." }, { status: 400 })
    }

    console.log(code)

    // Step 1: Exchange the code for a short-lived access token
    const shortLivedTokenParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri,
      code: code,
    })

    const shortLivedTokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: shortLivedTokenParams.toString(),
    })

    const shortLivedTokenData = await shortLivedTokenResponse.json()
    if (shortLivedTokenData.error_message) {
      throw new Error(shortLivedTokenData.error_message)
    }

    const shortLivedToken = shortLivedTokenData.access_token
    console.log(shortLivedToken)

    // Step 2: Exchange the short-lived token for a long-lived token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET!}&access_token=${shortLivedToken}`,
    )

    const longLivedTokenData = await longLivedTokenResponse.json()
    if (longLivedTokenData.error) {
      throw new Error(longLivedTokenData.error.message)
    }

    const longLivedToken = longLivedTokenData.access_token
    console.log(longLivedToken)

    // const currentTimestamp = Math.floor(Date.now() / 1000).toString()
    // const storedToken = await storeInstagramTokenInRedis(userId, name, longLivedToken, currentTimestamp)

    const expiresInSeconds = longLivedTokenData.expires_in;
    const expiryTimestamp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    console.log(`Long-lived token acquired. Expires in: ${expiresInSeconds} seconds.`);

    const currentTimestamp = Math.floor(Date.now() / 1000).toString()
    const storedToken = await storeInstagramTokenInRedis(
        userId,
        name,
        longLivedToken,
        expiryTimestamp.toString(), // <-- Pass expiry timestamp
        currentTimestamp
    );
    if (!storedToken) {
      throw new Error("Failed to store Instagram token in redis")
    }

    const result = await storeInstagramTokenInDatabase(userId, longLivedToken)
    if (!result.success) {
      throw new Error("Failed to store Instagram token in database")
    }
    // Add user to the polling list
    const addedToPolling = await addUserToPollingList(userId)
    if (!addedToPolling) {
      console.warn(`Failed to add user ${userId} to polling list, but token was stored`)
    }

    console.log(`[v0] Successfully stored Instagram token for user ${userId} and added to polling list`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Instagram token exchange error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}
