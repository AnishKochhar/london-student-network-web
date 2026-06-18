import Link from "next/link";
import {
    RssIcon,
    InboxArrowDownIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import SocietyAdminNav from "@/app/components/admin/societies/society-admin-nav";
import { getStats } from "@/app/lib/societies/queries";

export const dynamic = "force-dynamic";

/**
 * Society Intelligence admin dashboard (spec §8.1). Server component — reads
 * stats directly via `getStats()` (store mode locally, Postgres in DB mode).
 */
export default async function SocietyAdminDashboard() {
    const stats = await getStats();

    return (
        <div>
            <AdminPageHeader
                title="Society Intelligence"
                description="Ingest, enrich, review and publish London student society profiles. Internal preview — no outbound communication."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence" },
                ]}
                actions={
                    <>
                        <Link
                            href="/admin/societies/sources"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            <RssIcon className="h-4 w-4" />
                            Sources
                        </Link>
                        <Link
                            href="/admin/societies/imports"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            <InboxArrowDownIcon className="h-4 w-4" />
                            Imports
                        </Link>
                        <Link
                            href="/admin/societies/review"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            <ClipboardDocumentCheckIcon className="h-4 w-4" />
                            Review queue
                        </Link>
                    </>
                }
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />
                <SocietyAdminNav />

                {/* Primary counts */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <Stat label="Total societies" value={stats.total} />
                    <Stat label="Published" value={stats.published} accent="emerald" />
                    <Stat label="Pending review" value={stats.pendingReview} accent="amber" />
                    <Stat label="Drafts" value={stats.drafts} />
                    <Stat label="Duplicates" value={stats.duplicates} accent="rose" />
                    <Stat label="Claim-ready" value={stats.claimReady} accent="sky" />
                </div>

                {/* Pipeline + quality */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Stat label="Open review items" value={stats.openReviewItems} accent="amber" />
                    <Stat label="Pending imports" value={stats.pendingImports} />
                    <Stat
                        label="Avg completeness"
                        value={stats.averageCompleteness}
                        suffix="%"
                    />
                    <Stat label="Source coverage" value={stats.sourceCoverage} suffix="%" />
                </div>

                {/* Per-university */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="mb-4 text-sm font-semibold text-white">
                        Societies per university
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {stats.perUniversity.map((u) => (
                            <div
                                key={u.universityId}
                                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center"
                            >
                                <div className="text-2xl font-bold text-white">
                                    {u.count}
                                </div>
                                <div className="text-xs uppercase tracking-wide text-blue-200">
                                    {u.shortName}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ACCENTS: Record<string, string> = {
    default: "text-white",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
    sky: "text-sky-300",
};

function Stat({
    label,
    value,
    suffix = "",
    accent = "default",
}: {
    label: string;
    value: number;
    suffix?: string;
    accent?: keyof typeof ACCENTS | string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className={`text-2xl font-bold ${ACCENTS[accent] ?? ACCENTS.default}`}>
                {value}
                {suffix}
            </div>
            <div className="text-xs text-blue-200">{label}</div>
        </div>
    );
}
