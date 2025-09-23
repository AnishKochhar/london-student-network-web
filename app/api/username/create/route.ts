import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";
import { validateUsername, isUsernameAvailable } from "@/app/lib/username-utils";
import { CreateUsernameResponse } from "@/app/lib/types";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, error: "Authentication required" } as CreateUsernameResponse,
                { status: 401 }
            );
        }

        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { success: false, error: "Username is required" } as CreateUsernameResponse,
                { status: 400 }
            );
        }

        // Validate username format based on user role
        const userRole = session.user.role || 'user';
        const validation = validateUsername(username, userRole);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error } as CreateUsernameResponse,
                { status: 400 }
            );
        }

        // Check if user already has a username
        const existingUsername = await sql`
            SELECT username FROM usernames WHERE user_id = ${session.user.id}
        `;

        if (existingUsername.rows.length > 0) {
            return NextResponse.json(
                { success: false, error: "You already have a username set" } as CreateUsernameResponse,
                { status: 400 }
            );
        }

        // Check if username is available
        const available = await isUsernameAvailable(username);
        if (!available) {
            return NextResponse.json(
                { success: false, error: "Username is already taken" } as CreateUsernameResponse,
                { status: 400 }
            );
        }

        // Create the username
        await sql`
            INSERT INTO usernames (user_id, username)
            VALUES (${session.user.id}, ${username})
        `;

        return NextResponse.json({
            success: true,
            username: username
        } as CreateUsernameResponse);

    } catch (error) {
        console.error("Error creating username:", error);

        // Handle duplicate key error specifically
        if (error.message && error.message.includes('duplicate key')) {
            return NextResponse.json(
                { success: false, error: "Username is already taken" } as CreateUsernameResponse,
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Failed to create username" } as CreateUsernameResponse,
            { status: 500 }
        );
    }
}