// app/api/instagram/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

    // needs to redirect to a url and pass the json response as paramaters
    export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
            return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
        }

        // Optional: validate state here for CSRF protection
        // const expectedState = getExpectedStateFromCookieOrDb();
        // if (state !== expectedState) {
        //   return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
        // }

        const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', 
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: process.env.INSTAGRAM_CLIENT_ID!,
                    client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
                    grant_type: 'authorization_code',
                    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI!,
                    code,
                }),
            });

        if (!tokenRes.ok) {
        const err = await tokenRes.text();
        return NextResponse.json({ error: 'Failed to fetch access token', details: err }, { status: 500 });
        }

        const tokenData = await tokenRes.json() as { access_token: string, user_id: string };
        // tokenData: { access_token: string; user_id: string; }

        // TODO: store tokenData.access_token (and user_id) in your DB/session

        return NextResponse.json({
        success: true,
        access_token: tokenData.access_token,
        user_id: tokenData.user_id,
        }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
    }
}
