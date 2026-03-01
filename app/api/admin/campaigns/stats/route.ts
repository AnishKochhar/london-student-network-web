import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchOverallStats } from "@/app/lib/campaigns/queries";

// GET /api/admin/campaigns/stats - Get dashboard statistics
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stats = await fetchOverallStats();

        return NextResponse.json(stats);
    } catch (error) {
        console.error("Error fetching campaign stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
