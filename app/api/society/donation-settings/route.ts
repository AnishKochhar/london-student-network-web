import { NextResponse } from "next/server";
import { fetchSocietyDonationSettings } from "@/app/lib/data";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const organiserUid = searchParams.get('organiser_uid');

        if (!organiserUid) {
            return NextResponse.json(
                { error: "Missing organiser_uid parameter" },
                { status: 400 }
            );
        }

        const settings = await fetchSocietyDonationSettings(organiserUid);

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching donation settings:", error);
        return NextResponse.json(
            { allow_donations: false },
            { status: 200 } // Return default on error
        );
    }
}
