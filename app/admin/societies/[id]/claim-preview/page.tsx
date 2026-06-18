"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { NoSymbolIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import type { Society, SocietyClaimInvite } from "@/app/lib/societies/types";

type Readiness = { ready: boolean; reasons: string[] };

export default function ClaimPreviewPage() {
    const { id } = useParams<{ id: string }>();
    const [society, setSociety] = useState<Society | null>(null);
    const [invite, setInvite] = useState<SocietyClaimInvite | null>(null);
    const [readiness, setReadiness] = useState<Readiness | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/societies/${id}/claim`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSociety(data.society);
            setInvite(data.invite);
            setReadiness(data.readiness);
        } catch {
            toast.error("Couldn't load claim preview");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function post(kind: string, label: string) {
        setBusy(true);
        try {
            const res = await fetch(`/api/admin/societies/${id}/claim`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(label);
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Action failed");
        } finally {
            setBusy(false);
        }
    }

    if (loading) return <div className="p-8 text-white/60">Loading…</div>;
    if (!society)
        return <div className="p-8 text-white/60">Society not found.</div>;

    return (
        <div>
            <AdminPageHeader
                title="Claim preview"
                description={`Internal preview of the future claim invite for ${society.name}.`}
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Societies", href: "/admin/societies/list" },
                    {
                        label: society.name,
                        href: `/admin/societies/${society.id}`,
                    },
                    { label: "Claim preview" },
                ]}
            />

            <div className="space-y-6 p-6 sm:p-8">
                {/* The big, unmissable safety warning (spec §8.6). */}
                <div className="flex items-start gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-5 py-4 text-rose-100">
                    <NoSymbolIcon className="mt-0.5 h-6 w-6 shrink-0 text-rose-300" />
                    <div>
                        <div className="text-base font-bold">
                            Sending is disabled. This is an internal preview only.
                        </div>
                        <p className="mt-1 text-sm text-rose-100/80">
                            No email, DM or notification will be sent. There is no
                            send button anywhere in this system.
                        </p>
                    </div>
                </div>

                {/* Readiness */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-white">
                            Claim readiness
                        </h2>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                readiness?.ready
                                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
                                    : "bg-amber-500/15 text-amber-300 ring-amber-400/30"
                            }`}
                        >
                            {readiness?.ready ? "Claim-ready" : "Not ready"}
                        </span>
                    </div>
                    {!readiness?.ready && (
                        <ul className="mt-3 space-y-1 text-xs text-amber-200">
                            {readiness?.reasons.map((r, i) => (
                                <li key={i}>• {r}</li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            onClick={() => post("generate_draft", "Draft generated")}
                            disabled={busy}
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
                        >
                            {invite ? "Draft generated ✓" : "Generate draft"}
                        </button>
                        <button
                            onClick={() => post("mark_ready", "Marked claim-ready")}
                            disabled={busy || !readiness?.ready}
                            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-40"
                        >
                            Mark claim-ready
                        </button>
                    </div>
                </div>

                {/* Draft preview */}
                {invite ? (
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-sm font-semibold text-white">
                            Draft invite (preview)
                        </h2>
                        <Row label="Society">{society.name}</Row>
                        <Row label="Contact email">
                            {invite.email ?? "— none on file —"}
                        </Row>
                        <Row label="Claim URL preview">
                            <code className="break-all text-sky-300">
                                {invite.claimUrlPreview}
                            </code>
                        </Row>
                        <Row label="Subject draft">{invite.subjectDraft}</Row>
                        <div>
                            <div className="mb-1 text-xs font-medium text-blue-200">
                                Body draft
                            </div>
                            <pre className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/80">
                                {invite.bodyDraft}
                            </pre>
                        </div>
                        <div className="text-xs text-white/40">
                            Status: {invite.status} · sending disabled:{" "}
                            {String(invite.sendDisabled)} (always true)
                        </div>
                        {/* Intentionally NO send button. */}
                    </div>
                ) : (
                    <p className="text-white/60">
                        No draft yet. Generate one to preview the invite.
                    </p>
                )}

                <Link
                    href={`/admin/societies/${society.id}`}
                    className="inline-block text-sm text-sky-300 hover:underline"
                >
                    ← Back to society
                </Link>
            </div>
        </div>
    );
}

function Row({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-blue-200">{label}</span>
            <span className="text-sm text-white">{children}</span>
        </div>
    );
}
