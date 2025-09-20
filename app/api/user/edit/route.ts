import { NextResponse } from "next/server";
import { deleteEvents } from "@/app/lib/data";
import { z } from "zod";

const DeleteEventSchema = z.object({
    ids: z.array(z.string().uuid()), // expecting an array of valid UUID strings
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { ids } = DeleteEventSchema.parse(body);

        await deleteEvents(ids);

        return NextResponse.json(
            { message: "Events deleted successfully" },
            { status: 200 },
        );
    } catch (error) {
        console.error("Error deleting events:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid request data", details: error.errors },
                { status: 400 },
            );
        }
        return NextResponse.json(
            { error: "Failed to delete events" },
            { status: 500 },
        );
    }
}
