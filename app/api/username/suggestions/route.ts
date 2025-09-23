import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAvailableUsernameSuggestions } from "@/app/lib/username-utils";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // Get suggestions based on user's name and role
        const userRole = session.user.role || 'user';
        const suggestions = await getAvailableUsernameSuggestions(session.user.name || "", userRole, 8);

        return NextResponse.json({
            suggestions: suggestions
        });

    } catch (error) {
        console.error("Error getting username suggestions:", error);
        return NextResponse.json(
            { error: "Failed to get username suggestions" },
            { status: 500 }
        );
    }
}