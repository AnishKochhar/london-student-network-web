import { NextResponse } from "next/server";
import { getSlugByOrganiserId } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const { organiser_uid } = await request.json();

        if (!organiser_uid) {
            return NextResponse.json(
                { success: false, error: "Missing organiser_uid parameter" },
                { status: 400 }
            );
        }

        const result = await getSlugByOrganiserId(organiser_uid);

        if (!result || !result.slug) {
            return NextResponse.json(
                { success: false, error: "Slug not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            slug: result.slug,
        });
    } catch (error) {
        console.error("Error fetching slug by organiser ID:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
