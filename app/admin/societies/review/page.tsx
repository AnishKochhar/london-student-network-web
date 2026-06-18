"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    CheckIcon,
    XMarkIcon,
    ArrowsRightLeftIcon,
    NoSymbolIcon,
    QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import AdminPageHeader from "@/app/components/admin/admin-page-header";
import OutboundDisabledBanner from "@/app/components/admin/societies/outbound-disabled-banner";
import SocietyAdminNav from "@/app/components/admin/societies/society-admin-nav";
import type {
    ReviewItemPriority,
    ReviewItemStatus,
    SocietyReviewItem,
} from "@/app/lib/societies/types";

const PRIORITY_STYLES: Record<ReviewItemPriority, string> = {
    critical: "bg-rose-500/20 text-rose-200 ring-rose-400/40",
    high: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
    medium: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
    low: "bg-white/10 text-white/50 ring-white/15",
};

const STATUSES: ReviewItemStatus[] = [
    "open",
    "approved",
    "rejected",
    "merged",
    "needs_more_info",
    "ignored",
];

export default function ReviewQueuePage() {
    const [items, setItems] = useState<SocietyReviewItem[]>([]);
    const [status, setStatus] = useState<ReviewItemStatus>("open");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/society-review?status=${status}`);
            const data = await res.json();
            setItems(data.items ?? []);
        } catch {
            toast.error("Couldn't load the review queue");
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        load();
    }, [load]);

    async function decide(item: SocietyReviewItem, decision: string) {
        setBusy(item.id);
        try {
            const res = await fetch(`/api/admin/society-review/${item.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(data.effect || "Done");
            load();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Action failed");
        } finally {
            setBusy(null);
        }
    }

    return (
        <div>
            <AdminPageHeader
                title="Review queue"
                description="Everything uncertain lands here. Decisions update the underlying records — and never send anything externally."
                breadcrumbs={[
                    { label: "Admin", href: "/admin" },
                    { label: "Society Intelligence", href: "/admin/societies" },
                    { label: "Review queue" },
                ]}
                actions={
                    <select
                        value={status}
                        onChange={(e) =>
                            setStatus(e.target.value as ReviewItemStatus)
                        }
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-[#083157]">
                                {s.replace(/_/g, " ")}
                            </option>
                        ))}
                    </select>
                }
            />

            <div className="space-y-6 p-6 sm:p-8">
                <OutboundDisabledBanner />
                <SocietyAdminNav />

                {loading ? (
                    <p className="text-white/60">Loading…</p>
                ) : items.length === 0 ? (
                    <p className="text-white/60">
                        Nothing in “{status.replace(/_/g, " ")}”. The queue is clear.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${PRIORITY_STYLES[item.priority]}`}
                                            >
                                                {item.priority}
                                            </span>
                                            <span className="text-xs uppercase tracking-wide text-blue-200">
                                                {item.entityType.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-xs text-white/40">
                                                {item.reason.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="mt-1 font-medium text-white">
                                            {item.title}
                                        </div>
                                        {item.summary && (
                                            <p className="mt-1 text-sm text-white/60">
                                                {item.summary}
                                            </p>
                                        )}
                                        <div className="mt-1 text-xs text-white/40">
                                            Recommended: {item.recommendedAction}
                                            {item.confidenceScore != null &&
                                                ` · confidence ${item.confidenceScore}`}
                                            {item.riskScore != null &&
                                                ` · risk ${item.riskScore}`}
                                        </div>
                                    </div>

                                    {item.status === "open" && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {item.entityType === "duplicate_match" && (
                                                <ActionBtn
                                                    onClick={() => decide(item, "merge")}
                                                    disabled={busy === item.id}
                                                    tone="sky"
                                                    icon={<ArrowsRightLeftIcon className="h-4 w-4" />}
                                                    label="Merge"
                                                />
                                            )}
                                            <ActionBtn
                                                onClick={() => decide(item, "approve")}
                                                disabled={busy === item.id}
                                                tone="emerald"
                                                icon={<CheckIcon className="h-4 w-4" />}
                                                label="Approve"
                                            />
                                            <ActionBtn
                                                onClick={() => decide(item, "reject")}
                                                disabled={busy === item.id}
                                                tone="rose"
                                                icon={<XMarkIcon className="h-4 w-4" />}
                                                label="Reject"
                                            />
                                            {item.entityType === "society" && (
                                                <Link
                                                    href={`/admin/societies/${item.entityId}`}
                                                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white hover:bg-white/10"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                            <ActionBtn
                                                onClick={() => decide(item, "needs_more_info")}
                                                disabled={busy === item.id}
                                                tone="white"
                                                icon={<QuestionMarkCircleIcon className="h-4 w-4" />}
                                                label="More info"
                                            />
                                            <ActionBtn
                                                onClick={() => decide(item, "ignore")}
                                                disabled={busy === item.id}
                                                tone="white"
                                                icon={<NoSymbolIcon className="h-4 w-4" />}
                                                label="Ignore"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionBtn({
    onClick,
    disabled,
    tone,
    icon,
    label,
}: {
    onClick: () => void;
    disabled: boolean;
    tone: "emerald" | "rose" | "sky" | "white";
    icon: React.ReactNode;
    label: string;
}) {
    const tones: Record<string, string> = {
        emerald:
            "border-emerald-400/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20",
        rose: "border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
        sky: "border-sky-400/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20",
        white: "border-white/15 bg-white/5 text-white hover:bg-white/10",
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs disabled:opacity-50 ${tones[tone]}`}
        >
            {icon}
            {label}
        </button>
    );
}
