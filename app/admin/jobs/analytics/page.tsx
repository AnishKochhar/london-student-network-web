"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import type { OpportunityStats } from "@/app/lib/opportunities/types";

type TopOpp = {
    id: string;
    slug: string;
    title: string;
    organisation: string;
    viewCount: number;
    applyCount: number;
    saveCount: number;
    score: number;
};

type SourceScore = {
    source: { id: string; name: string; type: string };
    opportunitiesProduced: number;
    totalViews: number;
    totalApplies: number;
    totalSaves: number;
    score: number;
};

export default function AdminJobsAnalyticsPage() {
    const [stats, setStats] = useState<OpportunityStats | null>(null);
    const [top, setTop] = useState<TopOpp[]>([]);
    const [sources, setSources] = useState<SourceScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/opportunity-analytics")
            .then((r) => r.json())
            .then((d) => {
                setStats(d.stats ?? null);
                setTop(d.topOpportunities ?? []);
                setSources(d.sources ?? []);
            })
            .catch(() => toast.error("Couldn't load analytics"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <AdminPageHeader
                title="Jobs analytics"
                description="What students engage with — and which sources actually perform."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Jobs", href: "/admin/jobs" },
                    { label: "Analytics" },
                ]}
            />

            <div className="p-6 sm:p-8">
                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : (
                    <div className="space-y-10">
                        {stats && (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                                <Stat label="Published" value={stats.published} />
                                <Stat label="Drafts" value={stats.drafts} />
                                <Stat
                                    label="Pending imports"
                                    value={stats.pendingImports}
                                />
                                <Stat label="Total views" value={stats.totalViews} />
                                <Stat label="Total saves" value={stats.totalSaves} />
                                <Stat
                                    label="Apply clicks"
                                    value={stats.totalApplyClicks}
                                />
                            </div>
                        )}

                        <Section title="Top opportunities">
                            {top.length === 0 ? (
                                <Empty />
                            ) : (
                                <Table
                                    head={["Opportunity", "Views", "Saves", "Applies", "Score"]}
                                    rows={top.map((o) => [
                                        <Link
                                            key={o.id}
                                            href={`/jobs/${o.slug}`}
                                            target="_blank"
                                            className="text-white hover:underline"
                                        >
                                            {o.title}
                                            <span className="block text-xs text-white/50">
                                                {o.organisation}
                                            </span>
                                        </Link>,
                                        o.viewCount,
                                        o.saveCount,
                                        o.applyCount,
                                        o.score,
                                    ])}
                                />
                            )}
                        </Section>

                        <Section title="Source performance">
                            {sources.length === 0 ? (
                                <Empty />
                            ) : (
                                <Table
                                    head={[
                                        "Source",
                                        "Published",
                                        "Views",
                                        "Saves",
                                        "Applies",
                                        "Score",
                                    ]}
                                    rows={sources.map((s) => [
                                        <span key={s.source.id} className="text-white">
                                            {s.source.name}
                                            <span className="block text-xs text-white/50">
                                                {s.source.type.replace(/_/g, " ")}
                                            </span>
                                        </span>,
                                        s.opportunitiesProduced,
                                        s.totalViews,
                                        s.totalSaves,
                                        s.totalApplies,
                                        s.score,
                                    ])}
                                />
                            )}
                        </Section>
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-blue-200">{label}</div>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
            {children}
        </section>
    );
}

function Empty() {
    return (
        <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center text-sm text-white/50">
            No data yet — engagement appears here as students browse and apply.
        </p>
    );
}

function Table({
    head,
    rows,
}: {
    head: string[];
    rows: React.ReactNode[][];
}) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
            <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-blue-200">
                    <tr>
                        {head.map((h, i) => (
                            <th
                                key={h}
                                className={`px-4 py-3 ${i === 0 ? "" : "text-right"}`}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {rows.map((row, ri) => (
                        <tr key={ri} className="hover:bg-white/[0.03]">
                            {row.map((cell, ci) => (
                                <td
                                    key={ci}
                                    className={`px-4 py-3 ${ci === 0 ? "" : "text-right text-white/70"}`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
