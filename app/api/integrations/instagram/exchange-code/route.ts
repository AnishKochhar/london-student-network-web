export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return Response.json({ error: "Authorization code is missing." }, { status: 400 })
    }
    console.log(code)

    // Step 1: Exchange the code for a short-lived access token
    const shortLivedTokenParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID!,
      client_secret: process.env.INSTAGRAM_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI!,
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
    // The long-lived token is valid for 60 days and can be refreshed.

    // --- IMPORTANT ---
    // At this point, you would securely save the `longLivedToken`
    // in your database, associated with the current user/society.
    // e.g., await db.updateSociety({ where: { id: societyId }, data: { instagramToken: longLivedToken } });
    // ---

    return Response.json({ success: true })
  } catch (error) {
    console.error("Instagram token exchange error:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}
