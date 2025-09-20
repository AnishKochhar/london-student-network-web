import { getEmailFromToken } from "@/app/lib/redis-operations";
import { updatePassword } from "@/app/lib/data";
import { NextResponse, NextRequest } from "next/server";

// Reset password associated with token and new password from body
export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Token not provided" },
                { status: 500 },
            );
        }

        const response = await getEmailFromToken(token, "reset_password");

        if (!response.success) {
            return NextResponse.json(
                { success: false, error: "No email associated with token" },
                { status: 500 },
            );
        }

        const email = response.email;
        const result = await updatePassword(email, password);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: "Error updating password for user" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to reset password" },
            { status: 500 },
        );
    }
}
