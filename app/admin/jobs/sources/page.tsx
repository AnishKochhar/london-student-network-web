"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlayIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import {
    OPPORTUNITY_SOURCE_TYPE_LABELS,
    type OpportunitySource,
    type OpportunitySourceType,
} from "@/app/lib/opportunities/types";

const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400/50";

export default function AdminSourcesPage() {
    const [sources, setSources] = useState<OpportunitySource[]>([]);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState<OpportunitySourceType>("job_board");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/opportunity-sources");
            const data = await res.json();
            setSources(data.sources ?? []);
        } catch {
            toast.error("Couldn't load sources");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function addSource() {
        if (!name.trim() || !url.trim()) {
            toast.error("Name and URL are required.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/opportunity-sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, url, type, notes }),
            });
            if (!res.ok) throw new Error();
            toast.success("Source added");
            setName("");
            setUrl("");
            setNotes("");
            load();
        } catch {
            toast.error("Couldn't add source");
        } finally {
            setSaving(false);
        }
    }

    async function runScrape(s: OpportunitySource) {
        setScraping(s.id);
        try {
            const res = await fetch(
                `/api/admin/opportunity-sources/${s.id}/scrape`,
                { method: "POST" },
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Scrape failed");
            const run = data.run;
            toast.success(
                `Scrape done — ${run.itemsImported} imported, ${run.duplicatesFound} duplicates`,
            );
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Scrape failed");
        } finally {
            setScraping(null);
        }
    }

    async function remove(s: OpportunitySource) {
        if (!confirm(`Delete source "${s.name}"?`)) return;
        try {
            const res = await fetch(`/api/admin/opportunity-sources/${s.id}`, {
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
                title="Sources"
                description="Where opportunities come from. Run a scrape to pull links into the import queue for review."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Jobs", href: "/admin/jobs" },
                    { label: "Sources" },
                ]}
                actions={
                    <Link
                        href="/admin/jobs/imports"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                    >
                        Review imports
                    </Link>
                }
            />

            <div className="p-6 sm:p-8">
                {/* Add source */}
                <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="mb-4 text-sm font-semibold text-white">
                        Add a source
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                            className={inputClass}
                            placeholder="Name (e.g. Gradcracker)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            className={inputClass}
                            placeholder="https://…"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <select
                            className={inputClass}
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value as OpportunitySourceType)
                            }
                        >
                            {Object.entries(OPPORTUNITY_SOURCE_TYPE_LABELS).map(
                                ([v, l]) => (
                                    <option key={v} value={v} className="bg-[#083157]">
                                        {l}
                                    </option>
                                ),
                            )}
                        </select>
                        <input
                            className={inputClass}
                            placeholder="Notes (optional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={addSource}
                        disabled={saving}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300 disabled:opacity-60"
                    >
                        <PlusIcon className="h-4 w-4" />
                        {saving ? "Adding…" : "Add source"}
                    </button>
                </div>

                {/* List */}
                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : sources.length === 0 ? (
                    <p className="text-white/60">No sources yet.</p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-blue-200">
                                <tr>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Last scraped</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sources.map((s) => (
                                    <tr key={s.id} className="hover:bg-white/[0.03]">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">
                                                {s.name}
                                            </div>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-sky-300 hover:underline"
                                            >
                                                {s.url}
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            {OPPORTUNITY_SOURCE_TYPE_LABELS[s.type]}
                                        </td>
                                        <td className="px-4 py-3 text-white/60">
                                            {s.lastScrapedAt
                                                ? new Date(
                                                      s.lastScrapedAt,
                                                  ).toLocaleString("en-GB")
                                                : "Never"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => runScrape(s)}
                                                    disabled={scraping === s.id}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-60"
                                                >
                                                    <PlayIcon className="h-4 w-4" />
                                                    {scraping === s.id
                                                        ? "Scraping…"
                                                        : "Run scrape"}
                                                </button>
                                                <button
                                                    onClick={() => remove(s)}
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
        </div>
    );
}
