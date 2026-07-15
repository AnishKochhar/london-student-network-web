"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import type {
    OpportunityImport,
    OpportunityImportStatus,
} from "@/app/lib/opportunities/types";

const STATUS_STYLES: Record<OpportunityImportStatus, string> = {
    new: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    enriched: "bg-indigo-500/15 text-indigo-300 ring-indigo-400/30",
    pending_review: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    published: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    duplicate: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
    failed: "bg-red-500/15 text-red-300 ring-red-400/30",
};

const FILTERS: { value: "all" | OpportunityImportStatus; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending_review", label: "Pending review" },
    { value: "new", label: "New" },
    { value: "duplicate", label: "Duplicates" },
    { value: "published", label: "Published" },
    { value: "rejected", label: "Rejected" },
    { value: "failed", label: "Failed" },
];

export default function AdminImportsPage() {
    const router = useRouter();
    const [items, setItems] = useState<OpportunityImport[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | OpportunityImportStatus>("all");
    const [url, setUrl] = useState("");
    const [importing, setImporting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const qs = filter === "all" ? "" : `?status=${filter}`;
            const res = await fetch(`/api/admin/opportunity-imports${qs}`);
            const data = await res.json();
            setItems(data.imports ?? []);
        } catch {
            toast.error("Couldn't load imports");
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        load();
    }, [load]);

    async function importFromUrl() {
        if (!url.trim()) {
            toast.error("Paste a URL first.");
            return;
        }
        setImporting(true);
        try {
            const res = await fetch("/api/admin/opportunity-imports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Import failed");
            toast.success("Imported — review it now");
            setUrl("");
            if (data.import?.id) {
                router.push(`/admin/jobs/imports/${data.import.id}`);
            } else {
                load();
            }
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Import failed");
        } finally {
            setImporting(false);
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="Import queue"
                description="Paste a URL to import an opportunity, or review items pulled in by source scrapes."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Jobs", href: "/admin/jobs" },
                    { label: "Imports" },
                ]}
            />

            <div className="p-6 sm:p-8">
                {/* Import from URL */}
                <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="mb-3 text-sm font-semibold text-white">
                        Import from a URL
                    </h2>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400/50"
                            placeholder="https://company.com/careers/internship"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && importFromUrl()}
                        />
                        <button
                            onClick={importFromUrl}
                            disabled={importing}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300 disabled:opacity-60"
                        >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                            {importing ? "Importing…" : "Import"}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4 flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                                filter === f.value
                                    ? "bg-white text-[#041A2E]"
                                    : "border border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : items.length === 0 ? (
                    <p className="text-white/60">No imports in this view.</p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-blue-200">
                                <tr>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Quality</th>
                                    <th className="px-4 py-3 text-right">Relevance</th>
                                    <th className="px-4 py-3">Imported</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map((imp) => (
                                    <tr
                                        key={imp.id}
                                        onClick={() =>
                                            router.push(
                                                `/admin/jobs/imports/${imp.id}`,
                                            )
                                        }
                                        className="cursor-pointer hover:bg-white/[0.03]"
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/jobs/imports/${imp.id}`}
                                                className="font-medium text-white hover:underline"
                                            >
                                                {imp.extractedData?.title ||
                                                    imp.rawTitle ||
                                                    "Untitled import"}
                                            </Link>
                                            <div className="text-xs text-white/50">
                                                {imp.sourceName || imp.sourceUrl}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[imp.status]}`}
                                            >
                                                {imp.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">
                                            {imp.aiQualityScore ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-white/70">
                                            {imp.aiRelevanceScore ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-white/60">
                                            {new Date(
                                                imp.createdAt,
                                            ).toLocaleDateString("en-GB")}
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
