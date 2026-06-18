"use client";

import { useCallback, useEffect, useState } from "react";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import SocietyAdminNav from "@/app/components/admin/societies/society-admin-nav";
import type { InteractionStats } from "@/app/lib/societies/queries";
import type { SocietyStats } from "@/app/lib/societies/types";

export default function SocietyAnalyticsPage() {
    const [interactions, setInteractions] = useState<InteractionStats | null>(
        null,
    );
    const [societyStats, setSocietyStats] = useState<SocietyStats | null>(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/society-analytics");
            const data = await res.json();
            setInteractions(data.interactions ?? null);
            setSocietyStats(data.societyStats ?? null);
        } catch {
            /* non-fatal */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div>
            <AdminPageHeader
                title="Analytics"
                description="Interaction analytics foundation — profile views and outbound clicks. Feeds future recommendations."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Analytics" },
                ]}
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />
                <SocietyAdminNav />

                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <Stat label="Total interactions" value={interactions?.totalInteractions ?? 0} />
                            <Stat label="Profile views" value={interactions?.totalViews ?? 0} accent="sky" />
                            <Stat label="Outbound clicks" value={interactions?.totalClicks ?? 0} accent="emerald" />
                            <Stat label="Published societies" value={societyStats?.published ?? 0} />
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* By type */}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <h2 className="mb-4 text-sm font-semibold text-white">
                                    Interactions by type
                                </h2>
                                {interactions &&
                                Object.keys(interactions.byType).length > 0 ? (
                                    <ul className="space-y-2 text-sm">
                                        {Object.entries(interactions.byType)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([type, n]) => (
                                                <li
                                                    key={type}
                                                    className="flex justify-between text-white/70"
                                                >
                                                    <span>{type.replace(/_/g, " ")}</span>
                                                    <span className="font-semibold text-white">
                                                        {n}
                                                    </span>
                                                </li>
                                            ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-white/50">
                                        No interactions recorded yet.
                                    </p>
                                )}
                            </div>

                            {/* Top societies */}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <h2 className="mb-4 text-sm font-semibold text-white">
                                    Most viewed societies
                                </h2>
                                {interactions && interactions.topSocieties.length > 0 ? (
                                    <ul className="space-y-2 text-sm">
                                        {interactions.topSocieties.map((s) => (
                                            <li
                                                key={s.societyId}
                                                className="flex justify-between text-white/70"
                                            >
                                                <span>{s.name}</span>
                                                <span className="font-semibold text-white">
                                                    {s.views}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-white/50">
                                        No profile views recorded yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const ACCENTS: Record<string, string> = {
    default: "text-white",
    sky: "text-sky-300",
    emerald: "text-emerald-300",
};

function Stat({
    label,
    value,
    accent = "default",
}: {
    label: string;
    value: number;
    accent?: string;
}) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className={`text-2xl font-bold ${ACCENTS[accent] ?? ACCENTS.default}`}>
                {value}
            </div>
            <div className="text-xs text-blue-200">{label}</div>
        </div>
    );
}
