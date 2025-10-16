import { NextResponse, NextRequest } from "next/server";
import { sql } from "@vercel/postgres";
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

        // Check if this university email is already used by another user
        const existingUser = await sql`
            SELECT id FROM users
            WHERE university_email = ${universityEmail}
        `;

        if (existingUser.rows.length > 0 && existingUser.rows[0].id !== userId) {
            return NextResponse.json(
                {
                    success: false,
                    error: "This university email is already registered to another account"
                },
                { status: 409 },
            );
        }

        // Update user's university email
        await sql`
            UPDATE users
            SET university_email = ${universityEmail}
            WHERE id = ${userId}
        `;

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
        console.error("Error adding university email:", error);
        return NextResponse.json(
            { success: false, error: "Failed to add university email" },
            { status: 500 },
        );
    }
}
