import { NextResponse, NextRequest } from "next/server";
import {
    validateUniversityVerificationToken,
    verifyUniversityEmail,
} from "@/app/lib/university-verification";

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Token not provided" },
                { status: 400 },
            );
        }

        // Validate token and get user/email info
        const validationResult = await validateUniversityVerificationToken(token);

        if (!validationResult.success || !validationResult.userId || !validationResult.universityEmail) {
            return NextResponse.json(
                { success: false, error: "Invalid or expired token" },
                { status: 403 },
            );
        }

        // Mark university email as verified
        const verifyResult = await verifyUniversityEmail(
            validationResult.userId,
            validationResult.universityEmail,
            token,
        );

        if (!verifyResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: verifyResult.error || "Failed to verify university email"
                },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "University email verified successfully"
            },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error verifying university email:", error);
        return NextResponse.json(
            { success: false, error: "Failed to verify university email" },
            { status: 500 },
        );
    }
}
