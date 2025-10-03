import { NextResponse } from "next/server";
import { fetchAccountLogo } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const { organiser_uid } = await request.json();

        if (!organiser_uid) {
            return NextResponse.json(
                { success: false, error: "Missing organiser_uid" },
                { status: 400 }
            );
        }

        const result = await fetchAccountLogo(organiser_uid);

        if (!result || !result.logo_url) {
            return NextResponse.json(
                { success: false, error: "Logo not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            logo_url: result.logo_url,
        });
    } catch (error) {
        console.error("Error fetching society logo:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
