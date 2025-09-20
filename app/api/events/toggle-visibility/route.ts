import { NextResponse } from "next/server";
import { toggleEventVisibility } from "@/app/lib/data";

export async function POST(req: Request) {
    try {
        const { event_id, is_hidden } = await req.json();

        // Toggle visibility
        const result = await toggleEventVisibility(event_id, is_hidden);

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: "Failed to update visibility" }, { status: 500 });
        }
    } catch (error) {
        console.error("Toggle visibility error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}