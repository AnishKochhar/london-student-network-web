import { NextResponse } from "next/server";
import { softDeleteEvent } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event_id } = body;

        // Soft delete the event
        const result = await softDeleteEvent(event_id);

        if (result.success) {
            return NextResponse.json(
                { message: "Event deleted successfully" },
                { status: 200 },
            );
        } else {
            return NextResponse.json(
                { error: "Failed to delete event" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 },
        );
    }
}
