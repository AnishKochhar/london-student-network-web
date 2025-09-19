import { NextResponse } from "next/server";
import { checkOwnershipOfEvent } from "@/app/lib/data";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const { eventId } = await req.json();

        console.log("event id extracted");

        const session = await auth();

        console.log("session extracted");

        // extract id
        const userId = session?.user?.id;

        if (userId) {
            const accessGranted = await checkOwnershipOfEvent(userId, eventId);
            if (accessGranted) {
                return NextResponse.json(
                    { message: "Access Granted" },
                    { status: 200 }, // 200 OK
                );
            } else {
                return NextResponse.json(
                    {
                        message:
                            "Forbidden: You do not have permission to access this resource",
                    },
                    { status: 403 }, // 403 Forbidden
                );
            }
        } else {
            return NextResponse.json(
                { message: "Unauthorized: You must be authorized" },
                { status: 401 }, // 401 Unauthorized
            );
        }
    } catch (error) {
        console.error(
            "Error verifying requester, there was an error in session extraction, or ownership verification",
            error,
        );
        return NextResponse.json(
            { message: "Error verifying requester", error },
            { status: 500 }, // 500 Internal Server Error
        );
    }
}
