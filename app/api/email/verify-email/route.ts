import {
    getEmailFromToken,
    setEmailVerifiedField,
    validateToken,
} from "@/app/lib/redis-operations";
import { NextResponse, NextRequest } from "next/server";

// Reset password associated with token and new password from body
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Token not provided" },
                { status: 200 },
            );
        }

        const status = await validateToken(token, "verification");

        if (status === "invalid") {
            return NextResponse.json({ success: false }, { status: 403 }); // 403 Forbidden
        } else if (status === "expired") {
            return NextResponse.json({ success: false }, { status: 403 }); // 403 Forbidden
        }

        const response = await getEmailFromToken(token, "verification");

        if (!response.success) {
            return NextResponse.json(
                { success: false, error: "No email associated with token" },
                { status: 500 },
            );
        }

        const email = response.email;
        const result = await setEmailVerifiedField(email, token);

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Error updating emailverified field for user: ${result.error}`,
                },
                { status: 500 },
            );
        }

        // Return email so the frontend can use it for auto-login
        return NextResponse.json({
            success: true,
            email: email
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to verify email" },
            { status: 500 },
        );
    }
}
