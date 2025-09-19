import { NextResponse } from "next/server";
import { fetchUserEvents } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const { user_id } = await request.json();
        if (!user_id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 },
            );
        }
        const events = await fetchUserEvents(user_id);
        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching user events:", error);
        return NextResponse.json(
            { error: "Failed to fetch user events" },
            { status: 500 },
        );
    }
}
