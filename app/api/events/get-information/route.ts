import { fetchEventById } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { id }: { id: string } = await req.json();
    const event = await fetchEventById(id);
    return NextResponse.json(event);
}
