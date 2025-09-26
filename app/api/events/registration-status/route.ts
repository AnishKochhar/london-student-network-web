import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkIfRegistered } from "@/app/lib/data";

export async function POST(req: Request) {
    try {
        const { event_id } = await req.json();

        if (!event_id) {
            return NextResponse.json({
                success: false,
                error: "Event ID is required"
            }, { status: 400 });
        }

        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({
                success: true,
                isRegistered: false,
                message: "User not authenticated"
            });
        }

        const isRegistered = await checkIfRegistered(event_id, session.user.id);

        return NextResponse.json({
            success: true,
            isRegistered: isRegistered
        });

    } catch (error) {
        console.error("Error checking registration status:", error);
        return NextResponse.json({
            success: false,
            error: "Internal server error"
        }, { status: 500 });
    }
}