import { NextResponse } from "next/server";
import { getAllCompanyInformation } from "@/app/lib/data";

export async function GET() {
    try {
        const organisers = await getAllCompanyInformation();
        return NextResponse.json(organisers);
    } catch (error) {
        console.log("Error fetching organisers;", error);
        return NextResponse.json(
            { error: "Failed to fetch sponsors" },
            { status: 500 },
        );
    }
}
