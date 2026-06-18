"use client";

import { useCallback, useEffect, useState } from "react";
import {
    PlusIcon,
    TrashIcon,
    ArrowPathIcon,
    EyeSlashIcon,
    EyeIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import SocietyAdminNav from "@/app/components/admin/societies/society-admin-nav";
import {
    SOCIETY_SOURCE_TYPE_LABELS,
    type SocietySource,
    type SocietySourceType,
    type SocietySourceTrustLevel,
    type SocietySourceFetchStatus,
} from "@/app/lib/societies/types";
import { TARGET_UNIVERSITIES } from "@/app/lib/societies/universities";

const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-sky-400/50";

const FETCH_STATUS_STYLES: Record<SocietySourceFetchStatus, string> = {
    new: "bg-white/10 text-white/60 ring-white/15",
    queued: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    fetched: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
    failed: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
    ignored: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
};

const TRUST_STYLES: Record<SocietySourceTrustLevel, string> = {
    high: "text-emerald-300",
    medium: "text-amber-300",
    low: "text-white/50",
};

export default function SocietySourcesPage() {
    const [sources, setSources] = useState<SocietySource[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const [sourceName, setSourceName] = useState("");
    const [sourceUrl, setSourceUrl] = useState("");
    const [sourceType, setSourceType] =
        useState<SocietySourceType>("su_directory");
    const [universityId, setUniversityId] = useState("");
    const [trustLevel, setTrustLevel] =
        useState<SocietySourceTrustLevel>("medium");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/society-sources");
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

    async function seedRegistry() {
        setBusy("seed");
        try {
            const res = await fetch("/api/admin/society-sources/seed", {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(
                `Registry seeded — ${data.created} created, ${data.sources?.length ?? 0} total`,
            );
            load();
        } catch {
            toast.error("Couldn't seed registry");
        } finally {
            setBusy(null);
        }
    }

    async function addSource() {
        if (!sourceName.trim()) {
            toast.error("Source name is required.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch("/api/admin/society-sources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceName,
                    sourceUrl,
                    sourceType,
                    universityId: universityId || null,
                    trustLevel,
                }),
            });
            if (!res.ok) throw new Error();
            toast.success("Source added");
            setSourceName("");
            setSourceUrl("");
            load();
        } catch {
            toast.error("Couldn't add source");
        } finally {
            setSaving(false);
        }
    }

    async function patch(id: string, body: Record<string, unknown>, label: string) {
        setBusy(id);
        try {
            const res = await fetch(`/api/admin/society-sources/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
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

    async function remove(s: SocietySource) {
        if (!confirm(`Delete source "${s.sourceName}"?`)) return;
        setBusy(s.id);
        try {
            const res = await fetch(`/api/admin/society-sources/${s.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Deleted");
            load();
        } catch {
            toast.error("Couldn't delete");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="Sources"
                description="Where society data comes from — SU directories, the LSN CRM, existing site pages and more. Fetching reads public pages only."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Sources" },
                ]}
                actions={
                    <button
                        onClick={seedRegistry}
                        disabled={busy === "seed"}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
                    >
                        <SparklesIcon className="h-4 w-4" />
                        {busy === "seed" ? "Seeding…" : "Seed registry"}
                    </button>
                }
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />
                <SocietyAdminNav />

                {/* Add source */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="mb-4 text-sm font-semibold text-white">
                        Add a source
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <input
                            className={inputClass}
                            placeholder="Name (e.g. KCLSU societies directory)"
                            value={sourceName}
                            onChange={(e) => setSourceName(e.target.value)}
                        />
                        <input
                            className={inputClass}
                            placeholder="https://… (optional)"
                            value={sourceUrl}
                            onChange={(e) => setSourceUrl(e.target.value)}
                        />
                        <select
                            className={inputClass}
                            value={sourceType}
                            onChange={(e) =>
                                setSourceType(e.target.value as SocietySourceType)
                            }
                        >
                            {Object.entries(SOCIETY_SOURCE_TYPE_LABELS).map(
                                ([v, l]) => (
                                    <option key={v} value={v} className="bg-[#083157]">
                                        {l}
                                    </option>
                                ),
                            )}
                        </select>
                        <select
                            className={inputClass}
                            value={universityId}
                            onChange={(e) => setUniversityId(e.target.value)}
                        >
                            <option value="" className="bg-[#083157]">
                                No specific university
                            </option>
                            {TARGET_UNIVERSITIES.map((u) => (
                                <option key={u.id} value={u.id} className="bg-[#083157]">
                                    {u.shortName}
                                </option>
                            ))}
                        </select>
                        <select
                            className={inputClass}
                            value={trustLevel}
                            onChange={(e) =>
                                setTrustLevel(
                                    e.target.value as SocietySourceTrustLevel,
                                )
                            }
                        >
                            <option value="high" className="bg-[#083157]">
                                High trust
                            </option>
                            <option value="medium" className="bg-[#083157]">
                                Medium trust
                            </option>
                            <option value="low" className="bg-[#083157]">
                                Low trust
                            </option>
                        </select>
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
                    <p className="text-white/60">
                        No sources yet. Use “Seed registry” to add the five SU
                        directories, the LSN CRM and the existing-site source.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-blue-200">
                                <tr>
                                    <th className="px-4 py-3">Source</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">University</th>
                                    <th className="px-4 py-3">Trust</th>
                                    <th className="px-4 py-3">Fetch status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sources.map((s) => (
                                    <tr key={s.id} className="hover:bg-white/[0.03]">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">
                                                {s.sourceName}
                                            </div>
                                            {s.sourceUrl && (
                                                <a
                                                    href={s.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-sky-300 hover:underline"
                                                >
                                                    {s.sourceUrl}
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-white/70">
                                            {SOCIETY_SOURCE_TYPE_LABELS[s.sourceType]}
                                        </td>
                                        <td className="px-4 py-3 text-white/60 uppercase">
                                            {s.universityId ?? "—"}
                                        </td>
                                        <td
                                            className={`px-4 py-3 font-medium ${TRUST_STYLES[s.trustLevel]}`}
                                        >
                                            {s.trustLevel}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${FETCH_STATUS_STYLES[s.fetchStatus]}`}
                                            >
                                                {s.fetchStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        patch(
                                                            s.id,
                                                            { kind: "queue_fetch" },
                                                            "Queued for fetch",
                                                        )
                                                    }
                                                    disabled={busy === s.id}
                                                    title="Queue fetch (reads public pages later)"
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-60"
                                                >
                                                    <ArrowPathIcon className="h-4 w-4" />
                                                    Queue fetch
                                                </button>
                                                {s.fetchStatus === "ignored" ? (
                                                    <button
                                                        onClick={() =>
                                                            patch(
                                                                s.id,
                                                                { kind: "enable" },
                                                                "Enabled",
                                                            )
                                                        }
                                                        disabled={busy === s.id}
                                                        title="Enable"
                                                        className="rounded-lg p-1.5 text-emerald-300/80 hover:bg-emerald-500/10 hover:text-emerald-300"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            patch(
                                                                s.id,
                                                                { kind: "disable" },
                                                                "Disabled",
                                                            )
                                                        }
                                                        disabled={busy === s.id}
                                                        title="Disable"
                                                        className="rounded-lg p-1.5 text-amber-300/80 hover:bg-amber-500/10 hover:text-amber-300"
                                                    >
                                                        <EyeSlashIcon className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => remove(s)}
                                                    disabled={busy === s.id}
                                                    title="Delete"
                                                    className="rounded-lg p-1.5 text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300"
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
