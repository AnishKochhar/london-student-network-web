import { getOrganiserName } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { id } = await req.json();
    const response = await getOrganiserName(id);
    return NextResponse.json(response);
}
