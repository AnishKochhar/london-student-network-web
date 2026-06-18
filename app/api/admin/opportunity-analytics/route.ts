import { NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/opportunities/api-helpers";
import { getAllOpportunities, getStats } from "@/app/lib/opportunities/queries";
import { scoreSources } from "@/app/lib/opportunities/recommendations";
import { performanceScore } from "@/app/lib/opportunities/selectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/opportunity-analytics — dashboard data for /admin/jobs/analytics. */
export async function GET() {
    const admin = await requireAdmin();
    if (admin instanceof NextResponse) return admin;
    try {
        const [stats, all, sources] = await Promise.all([
            getStats(),
            getAllOpportunities(),
            scoreSources(),
        ]);

        const topOpportunities = all
            .filter((o) => o.status === "published")
            .map((o) => ({
                id: o.id,
                slug: o.slug,
                title: o.title,
                organisation: o.organisation,
                viewCount: o.viewCount,
                applyCount: o.applyCount,
                saveCount: o.saveCount,
                score: Math.round(performanceScore(o)),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        return NextResponse.json({ stats, topOpportunities, sources });
    } catch (error) {
        console.error("Error building analytics:", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
