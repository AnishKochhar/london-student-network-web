import { fetchWebsiteStats } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
    const stats = await fetchWebsiteStats();
    console.log(`Stats: ${stats}`);
    return new NextResponse(JSON.stringify(stats), {
        headers: { "Content-Type": "application/json" },
    });
}
