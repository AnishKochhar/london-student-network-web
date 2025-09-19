import { fetchEventWithUserId } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { event_id, user_id } = await request.json();

        if (!event_id || !user_id) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invalid data provided",
                    status: "invalid",
                },
                { status: 400 },
            );
        }

        const response = await fetchEventWithUserId(event_id, user_id);

        if (!response.success) {
            return NextResponse.json(
                { success: true, status: "invalid" },
                { status: 403 },
            ); // Forbidden
        }

        return NextResponse.json(
            { success: true, event: response.event },
            { status: 200 },
        );
    } catch (error) {
        return NextResponse.json(
            {
                success: true,
                message: "invalid",
                error: "Error in fetching event",
            },
            { status: 500 },
        );
    }
}
