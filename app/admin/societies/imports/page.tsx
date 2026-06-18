"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    ArrowUpTrayIcon,
    BeakerIcon,
    NoSymbolIcon,
    DocumentDuplicateIcon,
    FlagIcon,
    MagnifyingGlassIcon,
    RocketLaunchIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import SocietyAdminNav from "@/app/components/admin/societies/society-admin-nav";
import type {
    SocietyImportCandidate,
    SocietyImportStatus,
} from "@/app/lib/societies/types";

type CrmSummary = {
    rowsReceived: number;
    candidatesCreated: number;
    possibleDuplicates: number;
    reviewRequired: number;
    failed: number;
    columnMap: Record<string, string>;
};

const STATUS_STYLES: Record<SocietyImportStatus, string> = {
    new: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    parsed: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    matched_existing: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    created_draft: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    needs_review: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    rejected: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    duplicate: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    failed: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

// A small built-in sample so the import path is demoable before the real
// "LSN SOC outreach CRM.xlsx" is uploaded. Deliberately messy headers + a
// duplicate of a seed society + an unclear-university row.
const SAMPLE_ROWS = [
    {
        "Society Name": "KCL Debating Society",
        University: "King's College London",
        "SU URL": "https://www.kclsu.org/activities/societies/debating",
        Email: "debating@kclsu.org",
        Instagram: "@kcldebating",
        Category: "Debating",
        "Member Count": "280",
        "Status/Notes": "Strong committee, responsive",
    },
    {
        "Society Name": "UCL Photography Society",
        University: "UCL",
        "SU URL": "https://studentsunionucl.org/clubs-societies/photography",
        Email: "photosoc@ucl.ac.uk",
        Instagram: "@uclphotosoc",
        Category: "Arts & Media",
        "Member Count": "150",
        "Status/Notes": "Wants collaboration",
    },
    {
        "Society Name": "Imperial Finance Society",
        University: "Imperial College London",
        "SU URL": "",
        Email: "finance@imperial.ac.uk",
        Instagram: "@imperialfinance",
        Category: "Finance",
        "Member Count": "420",
        "Status/Notes": "",
    },
    {
        "Society Name": "London Anime & Manga Society",
        University: "Unknown / cross-uni",
        "SU URL": "",
        Email: "",
        Instagram: "@londonanime",
        Category: "Culture",
        "Member Count": "90",
        "Status/Notes": "University unclear",
    },
];

export default function SocietyImportsPage() {
    const [candidates, setCandidates] = useState<SocietyImportCandidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [summary, setSummary] = useState<CrmSummary | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/society-imports");
            const data = await res.json();
            setCandidates(data.candidates ?? []);
        } catch {
            toast.error("Couldn't load candidates");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function importRows(rows: Record<string, unknown>[]) {
        setImporting(true);
        setSummary(null);
        try {
            const res = await fetch("/api/admin/society-imports/crm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSummary(data.summary);
            toast.success(
                `Imported — ${data.summary.candidatesCreated} candidates, ${data.summary.reviewRequired} to review`,
            );
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Import failed");
        } finally {
            setImporting(false);
        }
    }

    function onFile(file: File) {
        const reader = new FileReader();
        const isCsv = file.name.endsWith(".csv") || file.type === "text/csv";
        reader.onload = (e) => {
            try {
                const wb = isCsv
                    ? XLSX.read(e.target?.result as string, { type: "string" })
                    : XLSX.read(e.target?.result as ArrayBuffer, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
                if (!rows.length) {
                    toast.error("No rows found in file.");
                    return;
                }
                importRows(rows);
            } catch {
                toast.error("Couldn't parse file.");
            }
        };
        if (isCsv) reader.readAsText(file);
        else reader.readAsArrayBuffer(file);
    }

    async function rescan() {
        setScanning(true);
        try {
            const res = await fetch("/api/admin/society-imports/rescan", {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(
                `Scanned ${data.summary.scanned} — ${data.summary.flaggedHigh} high-risk, ${data.summary.reviewItemsCreated} new review items`,
            );
            load();
        } catch {
            toast.error("Scan failed");
        } finally {
            setScanning(false);
        }
    }

    async function act(id: string, kind: string, label: string) {
        setBusy(id);
        try {
            const res = await fetch(`/api/admin/society-imports/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind }),
            });
            if (!res.ok) throw new Error();
            toast.success(label);
            load();
        } catch {
            toast.error("Action failed");
        } finally {
            setBusy(null);
        }
    }

    async function promote(id: string) {
        setBusy(id);
        try {
            const res = await fetch(
                `/api/admin/society-imports/${id}/promote`,
                { method: "POST" },
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success("Draft society created");
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't create draft");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="Imports"
                description="Bring societies in from the LSN CRM spreadsheet (or any .xlsx/.csv). Rows become reviewable candidates — existing societies are never overwritten."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Imports" },
                ]}
                actions={
                    <button
                        onClick={rescan}
                        disabled={scanning}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
                    >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                        {scanning ? "Scanning…" : "Scan for duplicates"}
                    </button>
                }
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />
                <SocietyAdminNav />

                {/* Upload */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="mb-1 text-sm font-semibold text-white">
                        Import CRM spreadsheet
                    </h2>
                    <p className="mb-4 text-xs text-blue-200">
                        Upload <code>LSN SOC outreach CRM.xlsx</code> (or any
                        .xlsx/.csv). Columns are auto-detected; raw rows are kept.
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => fileRef.current?.click()}
                            disabled={importing}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300 disabled:opacity-60"
                        >
                            <ArrowUpTrayIcon className="h-4 w-4" />
                            {importing ? "Importing…" : "Upload file"}
                        </button>
                        <button
                            onClick={() => importRows(SAMPLE_ROWS)}
                            disabled={importing}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
                        >
                            <BeakerIcon className="h-4 w-4" />
                            Import sample data
                        </button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onFile(f);
                                e.target.value = "";
                            }}
                        />
                    </div>
                </div>

                {/* Summary */}
                {summary && (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="mb-4 text-sm font-semibold text-white">
                            Import summary
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                            <Stat label="Rows received" value={summary.rowsReceived} />
                            <Stat label="Candidates created" value={summary.candidatesCreated} accent="emerald" />
                            <Stat label="Possible duplicates" value={summary.possibleDuplicates} accent="rose" />
                            <Stat label="Review required" value={summary.reviewRequired} accent="amber" />
                            <Stat label="Failed rows" value={summary.failed} accent="rose" />
                        </div>
                        {summary.columnMap &&
                            Object.keys(summary.columnMap).length > 0 && (
                                <p className="mt-4 text-xs text-blue-200">
                                    Detected columns:{" "}
                                    {Object.entries(summary.columnMap)
                                        .map(([f, h]) => `${f} → "${h}"`)
                                        .join(", ")}
                                </p>
                            )}
                    </div>
                )}

                {/* Candidates */}
                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : candidates.length === 0 ? (
                    <p className="text-white/60">
                        No import candidates yet. Upload the CRM or import the
                        sample data to begin.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-blue-200">
                                <tr>
                                    <th className="px-4 py-3">Society</th>
                                    <th className="px-4 py-3">University</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Dup risk</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {candidates.map((c) => (
                                    <tr key={c.id} className="hover:bg-white/[0.03]">
                                        <td className="px-4 py-3 font-medium text-white">
                                            {c.rawName}
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            <span className="uppercase">
                                                {c.universityId ?? "—"}
                                            </span>
                                            {c.rawUniversity && (
                                                <div className="text-xs text-white/40">
                                                    {c.rawUniversity}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            {c.rawCategory ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-white/60">
                                            <div>{c.rawEmail ?? ""}</div>
                                            <div className="text-xs text-white/40">
                                                {c.rawInstagram ?? ""}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            {c.duplicateRiskScore ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[c.status]}`}
                                            >
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => promote(c.id)}
                                                    disabled={busy === c.id}
                                                    title="Create draft society"
                                                    className="rounded-lg p-1.5 text-emerald-300/80 hover:bg-emerald-500/10 hover:text-emerald-300"
                                                >
                                                    <RocketLaunchIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        act(c.id, "needs_review", "Sent to review")
                                                    }
                                                    disabled={busy === c.id}
                                                    title="Send to review"
                                                    className="rounded-lg p-1.5 text-amber-300/80 hover:bg-amber-500/10 hover:text-amber-300"
                                                >
                                                    <FlagIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        act(c.id, "mark_duplicate", "Marked duplicate")
                                                    }
                                                    disabled={busy === c.id}
                                                    title="Mark duplicate"
                                                    className="rounded-lg p-1.5 text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300"
                                                >
                                                    <DocumentDuplicateIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        act(c.id, "reject", "Rejected")
                                                    }
                                                    disabled={busy === c.id}
                                                    title="Reject"
                                                    className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                                                >
                                                    <NoSymbolIcon className="h-4 w-4" />
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
