import { getAllOrganiserCards } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
    const response = await getAllOrganiserCards();
    return NextResponse.json(response);
}
