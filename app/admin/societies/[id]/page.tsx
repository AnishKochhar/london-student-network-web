"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowPathIcon,
    CheckBadgeIcon,
    ArrowTopRightOnSquareIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import {
    SOCIETY_TYPE_LABELS,
    type Society,
    type SocietySource,
    type SocietyType,
} from "@/app/lib/societies/types";

const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400/50";

type Eligibility = { eligible: boolean; reasons: string[]; scores: Record<string, number> };

export default function SocietyDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const [society, setSociety] = useState<Society | null>(null);
    const [sources, setSources] = useState<SocietySource[]>([]);
    const [eligibility, setEligibility] = useState<Eligibility | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState<Partial<Society>>({});

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/societies/${id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSociety(data.society);
            setSources(data.sources ?? []);
            setEligibility(data.eligibility ?? null);
            setForm(data.society ?? {});
        } catch {
            toast.error("Couldn't load society");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function patch(body: Record<string, unknown>) {
        const res = await fetch(`/api/admin/societies/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const reasons = (data.reasons as string[] | undefined) ?? [];
            throw new Error(
                reasons.length ? reasons.join(" ") : data.error || "Failed",
            );
        }
        return data;
    }

    async function save() {
        setBusy(true);
        try {
            await patch({
                kind: "edit",
                patch: {
                    name: form.name,
                    type: form.type,
                    category: form.category,
                    shortDescription: form.shortDescription,
                    description: form.description,
                    suProfileUrl: form.suProfileUrl,
                    membershipUrl: form.membershipUrl,
                    websiteUrl: form.websiteUrl,
                    instagramUrl: form.instagramUrl,
                    publicContactEmail: form.publicContactEmail,
                },
            });
            toast.success("Saved");
            load();
        } catch {
            toast.error("Save failed");
        } finally {
            setBusy(false);
        }
    }

    async function publish(force = false) {
        setBusy(true);
        try {
            await patch({ kind: "publish", force });
            toast.success(force ? "Force-published" : "Published");
            load();
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Publish failed";
            if (!force && confirm(`${msg}\n\nForce-publish anyway?`)) {
                await publish(true);
                return;
            }
            toast.error(msg);
        } finally {
            setBusy(false);
        }
    }

    async function enrich() {
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/societies/${id}/enrich`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const s = data.summary;
            toast.success(
                `Enriched — ${s.profileFieldsFilled.length} fields, ${s.socialsAttached.length} socials`,
            );
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Enrich failed");
        } finally {
            setBusy(false);
        }
    }

    async function simple(body: Record<string, unknown>, label: string) {
        setBusy(true);
        try {
            await patch(body);
            toast.success(label);
            load();
        } catch {
            toast.error("Action failed");
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8 text-white/60">Loading…</div>
        );
    }
    if (!society) {
        return <div className="p-8 text-white/60">Society not found.</div>;
    }

    const previewHref = `/network/${society.universityId}/${society.slug}`;

    return (
        <div>
            <AdminPageHeader
                title={society.name}
                description={`${society.universityName} · ${SOCIETY_TYPE_LABELS[society.type]} · ${society.status}`}
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Societies", href: "/admin/societies/list" },
                    { label: society.name },
                ]}
                actions={
                    <>
                        <Link
                            href={`/admin/societies/${society.id}/claim-preview`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            Claim preview
                        </Link>
                        <Link
                            href={previewHref}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                        >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            Public preview
                        </Link>
                    </>
                }
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Edit form */}
                    <div className="lg:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-sm font-semibold text-white">Profile</h2>
                        <Field label="Name">
                            <input
                                className={inputClass}
                                value={form.name ?? ""}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Type">
                                <select
                                    className={inputClass}
                                    value={form.type ?? "unknown"}
                                    onChange={(e) =>
                                        setForm({ ...form, type: e.target.value as SocietyType })
                                    }
                                >
                                    {Object.entries(SOCIETY_TYPE_LABELS).map(([v, l]) => (
                                        <option key={v} value={v} className="bg-[#083157]">
                                            {l}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Category">
                                <input
                                    className={inputClass}
                                    value={form.category ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, category: e.target.value })
                                    }
                                />
                            </Field>
                        </div>
                        <Field label="Short description">
                            <input
                                className={inputClass}
                                value={form.shortDescription ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, shortDescription: e.target.value })
                                }
                            />
                        </Field>
                        <Field label="Description">
                            <textarea
                                className={`${inputClass} min-h-[120px]`}
                                value={form.description ?? ""}
                                onChange={(e) =>
                                    setForm({ ...form, description: e.target.value })
                                }
                            />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="SU profile URL">
                                <input
                                    className={inputClass}
                                    value={form.suProfileUrl ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, suProfileUrl: e.target.value })
                                    }
                                />
                            </Field>
                            <Field label="Membership URL">
                                <input
                                    className={inputClass}
                                    value={form.membershipUrl ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, membershipUrl: e.target.value })
                                    }
                                />
                            </Field>
                            <Field label="Website">
                                <input
                                    className={inputClass}
                                    value={form.websiteUrl ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, websiteUrl: e.target.value })
                                    }
                                />
                            </Field>
                            <Field label="Instagram URL">
                                <input
                                    className={inputClass}
                                    value={form.instagramUrl ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, instagramUrl: e.target.value })
                                    }
                                />
                            </Field>
                            <Field label="Public contact email">
                                <input
                                    className={inputClass}
                                    value={form.publicContactEmail ?? ""}
                                    onChange={(e) =>
                                        setForm({ ...form, publicContactEmail: e.target.value })
                                    }
                                />
                            </Field>
                        </div>
                        <button
                            onClick={save}
                            disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-4 py-2 text-sm font-semibold text-[#04243f] hover:from-sky-300 hover:to-emerald-300 disabled:opacity-60"
                        >
                            Save changes
                        </button>
                    </div>

                    {/* Scores + actions */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h2 className="mb-4 text-sm font-semibold text-white">Scores</h2>
                            <ScoreRow label="Profile completeness" value={society.profileCompletenessScore} />
                            <ScoreRow label="Source confidence" value={society.sourceConfidenceScore} />
                            <ScoreRow label="Duplicate risk" value={society.duplicateRiskScore} invert />
                            <ScoreRow label="Publish confidence" value={society.publishConfidenceScore} />
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => simple({ kind: "recompute" }, "Recomputed")}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                                >
                                    <ArrowPathIcon className="h-4 w-4" />
                                    Recompute
                                </button>
                                <button
                                    onClick={enrich}
                                    disabled={busy}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                                >
                                    <SparklesIcon className="h-4 w-4" />
                                    Enrich
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                                <CheckBadgeIcon className="h-4 w-4 text-emerald-300" />
                                Publish gate
                            </h2>
                            {eligibility?.eligible ? (
                                <p className="text-sm text-emerald-300">
                                    Meets the publish threshold.
                                </p>
                            ) : (
                                <ul className="space-y-1 text-xs text-amber-200">
                                    {eligibility?.reasons.map((r, i) => (
                                        <li key={i}>• {r}</li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {society.status === "published" ? (
                                    <button
                                        onClick={() => simple({ kind: "unpublish" }, "Unpublished")}
                                        disabled={busy}
                                        className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10"
                                    >
                                        Unpublish
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => publish(false)}
                                        disabled={busy}
                                        className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                                    >
                                        Publish
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Sources */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                            <h2 className="mb-3 text-sm font-semibold text-white">
                                Sources ({sources.length})
                            </h2>
                            {sources.length === 0 ? (
                                <p className="text-xs text-white/50">
                                    No linked sources yet.
                                </p>
                            ) : (
                                <ul className="space-y-2 text-xs text-white/70">
                                    {sources.map((s) => (
                                        <li key={s.id}>
                                            <span className="text-white">{s.sourceName}</span>
                                            <span className="text-white/40"> · {s.trustLevel}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-medium text-blue-200">{label}</span>
            {children}
        </label>
    );
}

function ScoreRow({
    label,
    value,
    invert = false,
}: {
    label: string;
    value?: number | null;
    invert?: boolean;
}) {
    const v = value ?? 0;
    const good = invert ? v <= 10 : v >= 80;
    const mid = invert ? v <= 35 : v >= 50;
    const color = good
        ? "text-emerald-300"
        : mid
          ? "text-amber-300"
          : "text-rose-300";
    return (
        <div className="flex items-center justify-between py-1 text-sm">
            <span className="text-white/70">{label}</span>
            <span className={`font-semibold ${color}`}>
                {value == null ? "—" : value}
            </span>
        </div>
    );
}
