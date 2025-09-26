import { NextResponse } from "next/server";
import { deregisterFromEvent, fetchSQLEventById } from "@/app/lib/data";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const { event_id } = await req.json();

        const session = await auth();

        if (!session?.user) {
            return NextResponse.json({
                success: false,
                error: "Authentication required"
            }, { status: 401 });
        }

        const user = session.user;

        // Get event details for email
        const event = await fetchSQLEventById(event_id);
        if (!event) {
            return NextResponse.json({
                success: false,
                error: "Event not found"
            }, { status: 404 });
        }

        // Deregister the user
        const result = await deregisterFromEvent(event_id, user.id);

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 400 });
        }

        // TODO: Optionally send deregistration confirmation email
        // This can be implemented later if needed

        return NextResponse.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error("Error in deregister endpoint:", error);
        return NextResponse.json({
            success: false,
            error: "Internal server error"
        }, { status: 500 });
    }
}