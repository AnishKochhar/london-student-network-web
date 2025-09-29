import { NextResponse } from "next/server";
import { fetchUserEvents } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const { user_id, limit = 100, offset = 0, includeHidden = true } = await request.json();
        if (!user_id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 },
            );
        }
        const result = await fetchUserEvents(user_id, limit, offset, includeHidden);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching user events:", error);
        return NextResponse.json(
            { error: "Failed to fetch user events" },
            { status: 500 },
        );
    }
}
