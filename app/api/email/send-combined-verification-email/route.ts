import { NextResponse, NextRequest } from "next/server";
import { sendCombinedVerificationEmail } from "@/app/lib/send-email";
import {
    extractUniversityFromEmail,
    generateVerificationToken,
} from "@/app/lib/university-verification";
import { redis } from "@/app/lib/config";

export async function POST(request: NextRequest) {
    try {
        const { userId, email } = await request.json();

        if (!userId || !email) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 },
            );
        }

        // Validate university email domain
        const universityResult = await extractUniversityFromEmail(email);

        if (!universityResult.success || !universityResult.universityName) {
            return NextResponse.json(
                {
                    success: false,
                    error: universityResult.error || "Invalid university email domain",
                    details: universityResult  // Include full details for debugging
                },
                { status: 400 },
            );
        }

        // Generate and store combined verification token
        const token = await generateVerificationToken();

        // Store token in Redis for combined verification (both email AND university)
        const tokenKey = `combined_verification_token:${token}`;
        const userKey = `combined_verification_user:${userId}`;
        const emailKey = `verification_email:${email}`; // For regular email verification lookup

        // Use pipeline for atomic operations (consistent with university-verification.ts)
        const pipeline = redis.pipeline();
        pipeline.set(tokenKey, JSON.stringify({ userId, email }), "EX", 3600); // 1 hour expiry
        pipeline.set(userKey, token, "EX", 3600);
        pipeline.set(emailKey, token, "EX", 3600); // For regular verification flow compatibility
        pipeline.set(`verification_token:${token}`, email, "EX", 3600); // Reverse lookup for regular flow

        const results = await pipeline.exec();

        // Check if all operations succeeded
        if (!results || results.some(([error]) => error !== null)) {
            console.error("Failed to store verification tokens in Redis");
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to generate verification token"
                },
                { status: 500 },
            );
        }

        // Send verification email
        await sendCombinedVerificationEmail(
            email,
            token,
            universityResult.universityName,
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error sending combined verification email:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send verification email" },
            { status: 500 },
        );
    }
}
