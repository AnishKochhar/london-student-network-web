import { fetchEventById } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { id }: { id: string } = await req.json();
        const event = await fetchEventById(id);

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Failed to fetch event" },
            { status: 500 }
        );
    }
}
