"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OpportunityFields, {
    draftToForm,
    emptyForm,
    formToDraft,
    type OppFormValues,
} from "@/app/components/admin/jobs/opportunity-fields";
import type {
    Opportunity,
    OpportunityImport,
} from "@/app/lib/opportunities/types";

export default function ImportReviewPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const router = useRouter();

    const [record, setRecord] = useState<OpportunityImport | null>(null);
    const [form, setForm] = useState<OppFormValues>(emptyForm());
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [dupId, setDupId] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [showRaw, setShowRaw] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/opportunity-imports/${id}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            const imp: OpportunityImport = data.import;
            setRecord(imp);
            setForm(
                draftToForm({
                    ...(imp.extractedData ?? {}),
                    title: imp.extractedData?.title ?? imp.rawTitle ?? "",
                    organisation: imp.extractedData?.organisation ?? "",
                    status: "published",
                }),
            );
            setDupId(imp.duplicateOfOpportunityId ?? "");
        } catch {
            toast.error("Couldn't load import");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
        // Load opportunities for the duplicate selector.
        fetch("/api/admin/opportunities")
            .then((r) => r.json())
            .then((d) => setOpportunities(d.opportunities ?? []))
            .catch(() => {});
    }, [load]);

    async function action(body: Record<string, unknown>) {
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/opportunity-imports/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Action failed");
            return data;
        } finally {
            setBusy(false);
        }
    }

    async function reEnrich() {
        try {
            await action({ action: "enrich" });
            toast.success("Re-enriched");
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
        }
    }

    async function publish() {
        if (!form.title.trim() || !form.organisation.trim()) {
            toast.error("Title and organisation are required.");
            return;
        }
        try {
            const data = await action({
                action: "publish",
                editedData: formToDraft(form),
            });
            toast.success("Published");
            const slug = data.opportunity?.slug;
            router.push(slug ? `/jobs/${slug}` : "/admin/jobs/imports");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
        }
    }

    async function reject() {
        if (!confirm("Reject this import?")) return;
        try {
            await action({ action: "reject" });
            toast.success("Rejected");
            router.push("/admin/jobs/imports");
        } catch {
            toast.error("Failed");
        }
    }

    async function markDuplicate() {
        if (!dupId) {
            toast.error("Pick the existing opportunity it duplicates.");
            return;
        }
        try {
            await action({ action: "duplicate", duplicateOpportunityId: dupId });
            toast.success("Marked as duplicate");
            router.push("/admin/jobs/imports");
        } catch {
            toast.error("Failed");
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="Review import"
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Jobs", href: "/admin/jobs" },
                    { label: "Imports", href: "/admin/jobs/imports" },
                    { label: "Review" },
                ]}
            />

            <div className="p-6 sm:p-8">
                <Link
                    href="/admin/jobs/imports"
                    className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to queue
                </Link>

                {loading || !record ? (
                    <p className="text-white/60">Loading…</p>
                ) : (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Editable draft */}
                        <div className="lg:col-span-2">
                            <h2 className="mb-4 text-lg font-semibold text-white">
                                Edit before publishing
                            </h2>
                            <OpportunityFields
                                value={form}
                                onChange={(patch) =>
                                    setForm((f) => ({ ...f, ...patch }))
                                }
                                showStatus={false}
                            />

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    onClick={publish}
                                    disabled={busy}
                                    className="rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-2.5 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300 disabled:opacity-60"
                                >
                                    Publish opportunity
                                </button>
                                <button
                                    onClick={reject}
                                    disabled={busy}
                                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-5 py-2.5 text-sm font-medium text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>

                        {/* AI panel + raw + duplicate */}
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <div className="mb-3 flex items-center gap-2">
                                    <SparklesIcon className="h-5 w-5 text-emerald-300" />
                                    <h3 className="text-sm font-semibold text-white">
                                        Enrichment
                                    </h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <Score
                                        label="Quality"
                                        value={record.aiQualityScore}
                                    />
                                    <Score
                                        label="Relevance"
                                        value={record.aiRelevanceScore}
                                    />
                                </div>
                                {record.aiSummary && (
                                    <p className="mt-3 text-sm text-white/70">
                                        {record.aiSummary}
                                    </p>
                                )}
                                {record.aiReasoning && (
                                    <p className="mt-2 text-xs text-white/40">
                                        {record.aiReasoning}
                                    </p>
                                )}
                                <button
                                    onClick={reEnrich}
                                    disabled={busy}
                                    className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
                                >
                                    Re-run enrichment
                                </button>
                            </div>

                            {/* Duplicate */}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <h3 className="mb-3 text-sm font-semibold text-white">
                                    Mark as duplicate
                                </h3>
                                <select
                                    value={dupId}
                                    onChange={(e) => setDupId(e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                                >
                                    <option value="" className="bg-[#083157]">
                                        Select existing opportunity…
                                    </option>
                                    {opportunities.map((o) => (
                                        <option
                                            key={o.id}
                                            value={o.id}
                                            className="bg-[#083157]"
                                        >
                                            {o.title} — {o.organisation}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={markDuplicate}
                                    disabled={busy}
                                    className="mt-3 w-full rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-sm text-orange-200 hover:bg-orange-500/20 disabled:opacity-60"
                                >
                                    Mark duplicate
                                </button>
                            </div>

                            {/* Raw text */}
                            {record.sourceUrl && (
                                <a
                                    href={record.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block truncate text-xs text-sky-300 hover:underline"
                                >
                                    {record.sourceUrl}
                                </a>
                            )}
                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <button
                                    onClick={() => setShowRaw((s) => !s)}
                                    className="text-sm font-medium text-white/70 hover:text-white"
                                >
                                    {showRaw ? "Hide" : "Show"} raw scraped text
                                </button>
                                {showRaw && (
                                    <p className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs text-white/50">
                                        {record.rawText || "No text captured."}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function Score({ label, value }: { label: string; value?: number | null }) {
    const v = value ?? null;
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-white/60">{label}</span>
            <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
                        style={{ width: `${v ?? 0}%` }}
                    />
                </div>
                <span className="w-8 text-right text-white">{v ?? "—"}</span>
            </div>
        </div>
    );
}
