import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { validateUsername, isUsernameAvailable, getAvailableUsernameSuggestions } from "@/app/lib/username-utils";
import { UsernameCheckResponse } from "@/app/lib/types";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { available: false, error: "Authentication required" } as UsernameCheckResponse,
                { status: 401 }
            );
        }

        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { available: false, error: "Username is required" } as UsernameCheckResponse,
                { status: 400 }
            );
        }

        // Validate username format based on user role
        const userRole = session.user.role || 'user';
        const validation = validateUsername(username, userRole);
        if (!validation.valid) {
            // If invalid format, provide suggestions
            const suggestions = await getAvailableUsernameSuggestions(session.user.name || "", userRole, 5);
            return NextResponse.json({
                available: false,
                error: validation.error,
                suggestions: suggestions
            } as UsernameCheckResponse);
        }

        // Check if username is available
        const available = await isUsernameAvailable(username);

        if (available) {
            return NextResponse.json({
                available: true
            } as UsernameCheckResponse);
        } else {
            // Username taken, provide suggestions
            const suggestions = await getAvailableUsernameSuggestions(session.user.name || "", userRole, 5);
            return NextResponse.json({
                available: false,
                error: "Username is already taken",
                suggestions: suggestions
            } as UsernameCheckResponse);
        }

    } catch (error) {
        console.error("Error checking username:", error);
        return NextResponse.json(
            { available: false, error: "Failed to check username availability" } as UsernameCheckResponse,
            { status: 500 }
        );
    }
}