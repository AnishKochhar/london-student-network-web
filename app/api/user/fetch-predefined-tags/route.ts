import { fetchPredefinedTags } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
    const response = await fetchPredefinedTags();
    return NextResponse.json(response);
}
