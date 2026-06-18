"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowPathIcon,
    StarIcon as StarOutline,
    RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import SocietyAdminNav from "@/app/components/admin/societies/society-admin-nav";
import {
    SOCIETY_STATUS_LABELS,
    type Society,
    type SocietyStatus,
} from "@/app/lib/societies/types";

const STATUS_STYLES: Record<SocietyStatus, string> = {
    published: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    draft: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    pending_review: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    needs_review: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    duplicate: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    archived: "bg-white/10 text-white/50 ring-white/15",
};

export default function SocietyListPage() {
    const [societies, setSocieties] = useState<Society[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/societies");
            const data = await res.json();
            setSocieties(data.societies ?? []);
        } catch {
            toast.error("Couldn't load societies");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function patch(id: string, body: Record<string, unknown>) {
        const res = await fetch(`/api/admin/societies/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed");
        return data;
    }

    async function publish(s: Society) {
        setBusy(s.id);
        try {
            await patch(s.id, { kind: "publish" });
            toast.success("Published");
            load();
        } catch (e) {
            // Gate blocked it — offer a force override.
            const msg = e instanceof Error ? e.message : "Publish failed";
            if (confirm(`${msg}\n\nForce-publish anyway?`)) {
                try {
                    await patch(s.id, { kind: "publish", force: true });
                    toast.success("Force-published");
                    load();
                } catch {
                    toast.error("Force-publish failed");
                }
            }
        } finally {
            setBusy(null);
        }
    }

    async function simpleAction(
        s: Society,
        body: Record<string, unknown>,
        label: string,
    ) {
        setBusy(s.id);
        try {
            await patch(s.id, body);
            toast.success(label);
            load();
        } catch {
            toast.error("Action failed");
        } finally {
            setBusy(null);
        }
    }

    async function bulkPublish() {
        setBusy("bulk");
        try {
            const res = await fetch("/api/admin/societies/bulk-publish", {
                method: "POST",
            });
            const data = await res.json();
            toast.success(
                `Published ${data.published?.length ?? 0}, skipped ${data.skipped ?? 0}`,
            );
            load();
        } catch {
            toast.error("Bulk publish failed");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="Societies"
                description="Every society profile — drafts, pending and published. Publishing is gated by the conservative quality threshold."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Societies" },
                ]}
                actions={
                    <button
                        onClick={bulkPublish}
                        disabled={busy === "bulk"}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
                    >
                        <RocketLaunchIcon className="h-4 w-4" />
                        {busy === "bulk" ? "Publishing…" : "Publish eligible"}
                    </button>
                }
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />
                <SocietyAdminNav />

                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : societies.length === 0 ? (
                    <p className="text-white/60">
                        No societies yet. Promote candidates from Imports, or
                        ingest a directory.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-blue-200">
                                <tr>
                                    <th className="px-4 py-3">Society</th>
                                    <th className="px-4 py-3">Uni</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Complete</th>
                                    <th className="px-4 py-3 text-right">Publish conf.</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {societies.map((s) => (
                                    <tr key={s.id} className="hover:bg-white/[0.03]">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        simpleAction(
                                                            s,
                                                            {
                                                                kind: "feature",
                                                                isFeatured: !s.isFeatured,
                                                            },
                                                            s.isFeatured
                                                                ? "Unfeatured"
                                                                : "Featured",
                                                        )
                                                    }
                                                    className="text-amber-300/80 hover:text-amber-300"
                                                    title={s.isFeatured ? "Unfeature" : "Feature"}
                                                >
                                                    {s.isFeatured ? (
                                                        <StarSolid className="h-4 w-4" />
                                                    ) : (
                                                        <StarOutline className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <Link
                                                    href={`/admin/societies/${s.id}`}
                                                    className="font-medium text-white hover:underline"
                                                >
                                                    {s.name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 uppercase text-white/60">
                                            {s.universityShortName}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[s.status]}`}
                                            >
                                                {SOCIETY_STATUS_LABELS[s.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">
                                            {s.profileCompletenessScore ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">
                                            {s.publishConfidenceScore ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {s.status === "published" ? (
                                                    <button
                                                        onClick={() =>
                                                            simpleAction(
                                                                s,
                                                                { kind: "unpublish" },
                                                                "Unpublished",
                                                            )
                                                        }
                                                        disabled={busy === s.id}
                                                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white hover:bg-white/10"
                                                    >
                                                        Unpublish
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => publish(s)}
                                                        disabled={busy === s.id}
                                                        className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                                                    >
                                                        Publish
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        simpleAction(
                                                            s,
                                                            { kind: "recompute" },
                                                            "Recomputed",
                                                        )
                                                    }
                                                    disabled={busy === s.id}
                                                    title="Recompute scores"
                                                    className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                                                >
                                                    <ArrowPathIcon className="h-4 w-4" />
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
        </div>
    );
}
