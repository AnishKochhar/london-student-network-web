import { NextResponse } from "next/server";
import { checkSlugAvailability } from "@/app/lib/data";
import { validateSlug } from "@/app/lib/utils";

export async function POST(request: Request) {
    try {
        const { slug, excludeUserId } = await request.json();

        if (!slug) {
            return NextResponse.json(
                { success: false, available: false, error: "Missing slug parameter" },
                { status: 400 }
            );
        }

        // Validate slug format
        const validationError = validateSlug(slug);
        if (validationError) {
            return NextResponse.json({
                success: true,
                available: false,
                error: validationError,
            });
        }

        // Check database availability
        const isAvailable = await checkSlugAvailability(slug, excludeUserId);

        return NextResponse.json({
            success: true,
            available: isAvailable,
            error: isAvailable ? null : "This slug is already taken",
        });
    } catch (error) {
        console.error("Error checking slug availability:", error);
        return NextResponse.json(
            { success: false, available: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
