import { NextResponse } from "next/server";
import { fetchOrganisers } from "@/app/lib/data";

export async function GET() {
    try {
        const organisers = await fetchOrganisers();
        return NextResponse.json(organisers);
    } catch (error) {
        console.log("Error fetching organisers;", error);
        return NextResponse.json(
            { error: "Failed to fetch organisers" },
            { status: 500 },
        );
    }
}
