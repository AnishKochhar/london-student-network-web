import { validateToken } from "@/app/lib/redis-operations";
import { NextResponse, NextRequest } from "next/server";

// Validate token for resetting a password
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Token not provided",
                    status: "invalid",
                },
                { status: 400 },
            ); // 400 Bad Request
        }

        const status = await validateToken(token, "reset_password");

        if (status === "invalid") {
            return NextResponse.json(
                { success: true, message: "invalid" },
                { status: 403 },
            ); // 403 Forbidden
        } else if (status === "expired") {
            return NextResponse.json(
                { success: true, message: "expired" },
                { status: 403 },
            ); // 403 Forbidden
        }

        return NextResponse.json(
            { success: true, message: "valid" },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: true,
                message: "invalid",
                error: "Error in validating token",
            },
            { status: 500 },
        );
    }
}
