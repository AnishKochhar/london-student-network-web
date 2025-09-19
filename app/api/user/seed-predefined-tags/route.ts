import { seedPredefinedTags } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const predefinedTags = await req.json();
    const response = await seedPredefinedTags(predefinedTags);
    return NextResponse.json(response);
}
