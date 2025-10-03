import { NextResponse } from "next/server";
import { getOrganiserBySlug } from "@/app/lib/data";

export async function POST(request: Request) {
    try {
        const { slug } = await request.json();

        if (!slug) {
            return NextResponse.json(
                { success: false, error: "Missing slug parameter" },
                { status: 400 }
            );
        }

        const society = await getOrganiserBySlug(slug);

        if (!society) {
            return NextResponse.json(
                { success: false, error: "Society not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            society,
        });
    } catch (error) {
        console.error("Error fetching society by slug:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
