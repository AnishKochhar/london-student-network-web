"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    DocumentTextIcon,
    GlobeAltIcon,
    InboxArrowDownIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import SocietyAdminNav from "@/app/components/admin/societies/society-admin-nav";
import { TARGET_UNIVERSITIES } from "@/app/lib/societies/universities";
import type { SocietySource } from "@/app/lib/societies/types";

const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400/50";

type Summary = {
    candidatesFound: number;
    candidatesCreated: number;
    duplicates: number;
    reviewRequired: number;
    failed: number;
};

export default function SocietyIngestPage() {
    const [universityId, setUniversityId] = useState("kcl");
    const [html, setHtml] = useState("");
    const [busy, setBusy] = useState<"paste" | "live" | null>(null);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [sources, setSources] = useState<SocietySource[]>([]);

    const loadSources = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/society-sources");
            const data = await res.json();
            setSources(data.sources ?? []);
        } catch {
            /* non-fatal */
        }
    }, []);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    const suSourceForUni = sources.find(
        (s) => s.sourceType === "su_directory" && s.universityId === universityId,
    );

    async function run(body: Record<string, unknown>, mode: "paste" | "live") {
        setBusy(mode);
        setSummary(null);
        try {
            const res = await fetch("/api/admin/society-ingest/su-directory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSummary(data.summary);
            toast.success(
                `Ingested — ${data.summary.candidatesCreated} candidates, ${data.summary.reviewRequired} to review`,
            );
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Ingestion failed");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="SU directory ingestion"
                description="Pull societies from an official Students' Union directory. Paste the page HTML (always works) or try a best-effort live fetch."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Ingest" },
                ]}
                actions={
                    <Link
                        href="/admin/societies/imports"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                    >
                        <InboxArrowDownIcon className="h-4 w-4" />
                        View candidates
                    </Link>
                }
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />
                <SocietyAdminNav />

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <label className="mb-2 block text-sm font-semibold text-white">
                        University
                    </label>
                    <select
                        className={`${inputClass} sm:max-w-xs`}
                        value={universityId}
                        onChange={(e) => setUniversityId(e.target.value)}
                    >
                        {TARGET_UNIVERSITIES.map((u) => (
                            <option key={u.id} value={u.id} className="bg-[#083157]">
                                {u.name}
                            </option>
                        ))}
                    </select>

                    {/* Live fetch */}
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                            <GlobeAltIcon className="h-4 w-4 text-sky-300" />
                            Best-effort live fetch
                        </div>
                        <p className="mb-3 text-xs text-blue-200">
                            {suSourceForUni?.sourceUrl ? (
                                <>
                                    Will fetch{" "}
                                    <span className="text-sky-300">
                                        {suSourceForUni.sourceUrl}
                                    </span>
                                    . Many SU sites block bots — if it fails,
                                    paste the HTML below.
                                </>
                            ) : (
                                <>
                                    No registered SU directory source for this
                                    university yet — add one on the Sources page
                                    (or “Seed registry”), then return here.
                                </>
                            )}
                        </p>
                        <button
                            disabled={busy !== null || !suSourceForUni}
                            onClick={() =>
                                run({ sourceId: suSourceForUni!.id }, "live")
                            }
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
                        >
                            <GlobeAltIcon className="h-4 w-4" />
                            {busy === "live" ? "Fetching…" : "Try live fetch"}
                        </button>
                    </div>

                    {/* Paste HTML */}
                    <div className="mt-5">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                            <DocumentTextIcon className="h-4 w-4 text-emerald-300" />
                            Paste directory HTML
                        </div>
                        <textarea
                            className={`${inputClass} min-h-[180px] font-mono text-xs`}
                            placeholder="Paste the full HTML of the SU societies directory page here…"
                            value={html}
                            onChange={(e) => setHtml(e.target.value)}
                        />
                        <button
                            disabled={busy !== null || !html.trim()}
                            onClick={() => run({ universityId, html }, "paste")}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300 disabled:opacity-50"
                        >
                            <DocumentTextIcon className="h-4 w-4" />
                            {busy === "paste" ? "Parsing…" : "Parse pasted HTML"}
                        </button>
                    </div>
                </div>

                {summary && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="mb-4 text-sm font-semibold text-white">
                            Ingestion summary
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                            <Stat label="Found" value={summary.candidatesFound} />
                            <Stat label="Created" value={summary.candidatesCreated} accent="emerald" />
                            <Stat label="Duplicates" value={summary.duplicates} accent="rose" />
                            <Stat label="To review" value={summary.reviewRequired} accent="amber" />
                            <Stat label="Failed" value={summary.failed} accent="rose" />
                        </div>
                        <Link
                            href="/admin/societies/imports"
                            className="mt-4 inline-block text-sm text-sky-300 hover:underline"
                        >
                            Review the new candidates →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

const ACCENTS: Record<string, string> = {
    default: "text-white",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
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
