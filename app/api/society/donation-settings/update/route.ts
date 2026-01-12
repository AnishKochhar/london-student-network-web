import { NextResponse } from "next/server";
import { requireAuth, createAuthErrorResponse } from "@/app/lib/auth";
import { updateSocietyDonationSettings } from "@/app/lib/data";

export async function POST(req: Request) {
    try {
        const user = await requireAuth();

        // Only organisers can update donation settings
        if (user.role !== 'organiser' && user.role !== 'company') {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 403 }
            );
        }

        const { allow_donations } = await req.json();

        if (typeof allow_donations !== 'boolean') {
            return NextResponse.json(
                { success: false, error: "Invalid allow_donations value" },
                { status: 400 }
            );
        }

        const result = await updateSocietyDonationSettings(user.id, allow_donations);

        if (result.success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        if (error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")) {
            return createAuthErrorResponse(error);
        }
        console.error("Error updating donation settings:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update donation settings" },
            { status: 500 }
        );
    }
}
