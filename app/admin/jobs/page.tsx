"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    StarIcon as StarOutline,
    InboxArrowDownIcon,
    RssIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OpportunityFormModal from "@/app/components/admin/jobs/opportunity-form-modal";
import {
    OPPORTUNITY_TYPE_LABELS,
    type Opportunity,
    type OpportunityStatus,
} from "@/app/lib/opportunities/types";

const STATUS_STYLES: Record<OpportunityStatus, string> = {
    published: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    draft: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    closed: "bg-gray-500/15 text-gray-300 ring-gray-400/30",
    archived: "bg-white/10 text-white/50 ring-white/15",
};

export default function AdminJobsPage() {
    const [items, setItems] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Opportunity | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/opportunities");
            const data = await res.json();
            setItems(data.opportunities ?? []);
        } catch {
            toast.error("Couldn't load opportunities");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const stats = useMemo(() => {
        return {
            total: items.length,
            published: items.filter((o) => o.status === "published").length,
            drafts: items.filter((o) => o.status === "draft").length,
            views: items.reduce((s, o) => s + o.viewCount, 0),
            saves: items.reduce((s, o) => s + o.saveCount, 0),
        };
    }, [items]);

    async function patch(id: string, body: Record<string, unknown>) {
        const res = await fetch(`/api/admin/opportunities/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error();
    }

    async function togglePublish(o: Opportunity) {
        const next: OpportunityStatus =
            o.status === "published" ? "draft" : "published";
        try {
            await patch(o.id, { kind: "status", status: next });
            toast.success(next === "published" ? "Published" : "Unpublished");
            load();
        } catch {
            toast.error("Couldn't update status");
        }
    }

    async function toggleFeature(o: Opportunity) {
        try {
            await patch(o.id, { kind: "feature", featured: !o.featured });
            load();
        } catch {
            toast.error("Couldn't update featured");
        }
    }

    async function remove(o: Opportunity) {
        if (!confirm(`Delete "${o.title}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/admin/opportunities/${o.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Deleted");
            load();
        } catch {
            toast.error("Couldn't delete");
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="Opportunities"
                description="Create, edit and publish opportunities shown on /jobs."
                breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Jobs" }]}
                actions={
                    <>
                        <Link
                            href="/admin/jobs/analytics"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            <ChartBarIcon className="h-4 w-4" />
                            Analytics
                        </Link>
                        <Link
                            href="/admin/jobs/sources"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            <RssIcon className="h-4 w-4" />
                            Sources
                        </Link>
                        <Link
                            href="/admin/jobs/imports"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            <InboxArrowDownIcon className="h-4 w-4" />
                            Review imports
                        </Link>
                        <button
                            onClick={() => {
                                setEditing(null);
                                setModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-3 py-2 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300"
                        >
                            <PlusIcon className="h-4 w-4" />
                            New opportunity
                        </button>
                    </>
                }
            />

            <div className="p-6 sm:p-8">
                {/* Stat tiles */}
                <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
                    <Stat label="Total" value={stats.total} />
                    <Stat label="Published" value={stats.published} />
                    <Stat label="Drafts" value={stats.drafts} />
                    <Stat label="Total views" value={stats.views} />
                    <Stat label="Total saves" value={stats.saves} />
                </div>

                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : items.length === 0 ? (
                    <p className="text-white/60">
                        No opportunities yet. Create one or import from a URL.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-blue-200">
                                <tr>
                                    <th className="px-4 py-3">Opportunity</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Views</th>
                                    <th className="px-4 py-3 text-right">Saves</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map((o) => (
                                    <tr key={o.id} className="hover:bg-white/[0.03]">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleFeature(o)}
                                                    title={
                                                        o.featured
                                                            ? "Unfeature"
                                                            : "Feature"
                                                    }
                                                    className="text-amber-300/80 hover:text-amber-300"
                                                >
                                                    {o.featured ? (
                                                        <StarSolid className="h-4 w-4" />
                                                    ) : (
                                                        <StarOutline className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <div>
                                                    <Link
                                                        href={`/jobs/${o.slug}`}
                                                        target="_blank"
                                                        className="font-medium text-white hover:underline"
                                                    >
                                                        {o.title}
                                                    </Link>
                                                    <div className="text-xs text-white/50">
                                                        {o.organisation}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            {OPPORTUNITY_TYPE_LABELS[o.type]}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[o.status]}`}
                                            >
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">
                                            {o.viewCount}
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">
                                            {o.saveCount}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => togglePublish(o)}
                                                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white hover:bg-white/10"
                                                >
                                                    {o.status === "published"
                                                        ? "Unpublish"
                                                        : "Publish"}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditing(o);
                                                        setModalOpen(true);
                                                    }}
                                                    className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                                                    title="Edit"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => remove(o)}
                                                    className="rounded-lg p-1.5 text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300"
                                                    title="Delete"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <OpportunityFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initial={editing}
                onSaved={load}
            />
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
