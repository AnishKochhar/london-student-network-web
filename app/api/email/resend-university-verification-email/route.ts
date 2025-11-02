import { NextResponse, NextRequest } from "next/server";
import { sendUniversityVerificationEmail } from "@/app/lib/send-email";
import {
    extractUniversityFromEmail,
    generateVerificationToken,
    storeUniversityVerificationToken,
} from "@/app/lib/university-verification";

export async function POST(request: NextRequest) {
    try {
        const { userId, universityEmail } = await request.json();

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
