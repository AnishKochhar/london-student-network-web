import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sql } from "@vercel/postgres";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get user's username if it exists
        const result = await sql`
            SELECT username, created_at
            FROM usernames
            WHERE user_id = ${session.user.id}
        `;

        if (result.rows.length === 0) {
            return NextResponse.json({
                hasUsername: false,
                username: null
            });
        }

        return NextResponse.json({
            hasUsername: true,
            username: result.rows[0].username,
            createdAt: result.rows[0].created_at
        });

    } catch (error) {
        console.error("Error getting username:", error);
        return NextResponse.json(
            { error: "Failed to get username" },
            { status: 500 }
        );
    }
}