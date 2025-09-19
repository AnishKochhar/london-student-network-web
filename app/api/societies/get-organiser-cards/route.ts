import { getOrganiserCards } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { page, limit } = await req.json();
    const response = await getOrganiserCards(page, limit);
    return NextResponse.json(response);
}
