import { NextResponse } from "next/server";
import { getRegistrationsForEvent } from "@/app/lib/data";

export async function POST(req: Request) {
    const { event_id }: { event_id: string } = await req.json();
    const response = await getRegistrationsForEvent(event_id);
    return NextResponse.json(response);
}
