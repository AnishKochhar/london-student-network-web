import { NextResponse, NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
import { redis } from "@/app/lib/config";
import { extractUniversityFromEmail } from "@/app/lib/university-verification";

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Token not provided" },
                { status: 400 },
            );
        }

        // Validate token from Redis
        const tokenKey = `combined_verification_token:${token}`;
        const tokenData = await redis.get(tokenKey);

        if (!tokenData) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired token" },
                { status: 403 },
            );
        }

        const { userId, email } = JSON.parse(tokenData as string);

        // Extract university from email
        const universityResult = await extractUniversityFromEmail(email);

        if (!universityResult.success || !universityResult.universityCode) {
            return NextResponse.json(
                {
                    success: false,
                    error: universityResult.error || "Invalid university email domain"
                },
                { status: 400 },
            );
        }

        // Update both emailverified and university_email_verified in the database
        try {
            await sql`
                UPDATE users
                SET
                    emailverified = true,
                    university_email = ${email},
                    university_email_verified = true,
                    verified_university = ${universityResult.universityCode}
                WHERE id = ${userId}
            `;
        } catch (dbError: unknown) {
            // Handle unique constraint violation for university_email
            const error = dbError as { code?: string; message?: string };
            if (error.code === '23505' || error.message?.includes('duplicate key')) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "This university email has already been verified by another account"
                    },
                    { status: 409 },
                );
            }
            throw dbError;
        }

        // Clean up Redis tokens
        const userKey = `combined_verification_user:${userId}`;
        await redis.del(tokenKey);
        await redis.del(userKey);
        // Also clean up the regular verification token if it exists
        await redis.del(`token_${email}`);

        return NextResponse.json(
            {
                success: true,
                message: "Email and university account verified successfully"
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error verifying combined email:", error);
        return NextResponse.json(
            { success: false, error: "Failed to verify email" },
            { status: 500 },
        );
    }
}
