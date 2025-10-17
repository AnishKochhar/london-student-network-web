import { NextResponse, NextRequest } from "next/server";
import { sendUniversityVerificationEmail } from "@/app/lib/send-email";
import {
    extractUniversityFromEmail,
    generateVerificationToken,
    storeUniversityVerificationToken,
} from "@/app/lib/university-verification";
import { requireAuth } from "@/app/lib/auth";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let userId: string;
        let universityEmail: string;

        // Support two modes:
        // 1. From registration flow: { userId, universityEmail }
        // 2. From authenticated session: { email } (optional - uses primary email if not provided)
        if (body.userId && body.universityEmail) {
            // Registration flow
            userId = body.userId;
            universityEmail = body.universityEmail;
        } else {
            // Authenticated user flow
            const user = await requireAuth();
            userId = user.id;
            universityEmail = body.email || user.email; // Use provided email or primary email
        }

        if (!userId || !universityEmail) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 },
            );
        }

        // Validate university email domain
        const universityResult = await extractUniversityFromEmail(universityEmail);

        if (!universityResult.success || !universityResult.universityName) {
            return NextResponse.json(
                {
                    success: false,
                    error: universityResult.error || "Invalid university email domain"
                },
                { status: 400 },
            );
        }

        // Generate and store verification token
        const token = await generateVerificationToken();
        const storeResult = await storeUniversityVerificationToken(
            userId,
            universityEmail,
            token,
        );

        if (!storeResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to generate verification token"
                },
                { status: 500 },
            );
        }

        // Send verification email
        await sendUniversityVerificationEmail(
            universityEmail,
            token,
            universityResult.universityName,
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error sending university verification email:", error);
        return NextResponse.json(
            { success: false, error: "Failed to send verification email" },
            { status: 500 },
        );
    }
}
