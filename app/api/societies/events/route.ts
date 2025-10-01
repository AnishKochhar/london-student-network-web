import { NextResponse } from "next/server";
import { fetchUserEvents } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const { user_id, limit = 12, offset = 0 } = await request.json();
        if (!user_id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 },
            );
        }
        // Society pages: exclude hidden events, newest first
        const result = await fetchUserEvents(user_id, limit, offset, false, true);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching society events:", error);
        return NextResponse.json(
            { error: "Failed to fetch society events" },
            { status: 500 },
        );
    }
}