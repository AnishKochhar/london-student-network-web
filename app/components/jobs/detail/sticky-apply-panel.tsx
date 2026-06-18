"use client";

import {
    MapPinIcon,
    BanknotesIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    ShareIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import type { Opportunity } from "@/app/lib/opportunities/types";
import { OPPORTUNITY_TYPE_LABELS } from "@/app/lib/opportunities/types";
import DeadlineBadge from "../deadline-badge";
import SaveButton from "../save-button";
import ApplyLink from "../apply-link";

export default function StickyApplyPanel({
    opportunity: o,
    initialSaved,
    isLoggedIn,
    returnTo,
}: {
    opportunity: Opportunity;
    initialSaved: boolean;
    isLoggedIn: boolean;
    returnTo: string;
}) {
    async function share() {
        const url =
            typeof window !== "undefined" ? window.location.href : returnTo;
        try {
            if (navigator.share) {
                await navigator.share({ title: o.title, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
            }
        } catch {
            /* user cancelled share — ignore */
        }
        void fetch(`/api/opportunities/${o.id}/interactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventType: "share" }),
        }).catch(() => {});
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
            <DeadlineBadge deadline={o.deadline} />

            <div className="mt-4 space-y-2.5">
                <ApplyLink
                    opportunityId={o.id}
                    applyUrl={o.applyUrl}
                    variant="primary"
                    label="Apply now"
                    className="w-full"
                />
                <SaveButton
                    opportunityId={o.id}
                    initialSaved={initialSaved}
                    isLoggedIn={isLoggedIn}
                    returnTo={returnTo}
                    variant="full"
                    className="w-full"
                />
                <button
                    onClick={share}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                >
                    <ShareIcon className="h-5 w-5" />
                    Share
                </button>
            </div>

            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                <Fact
                    icon={<BriefcaseIcon className="h-4 w-4" />}
                    label="Type"
                    value={OPPORTUNITY_TYPE_LABELS[o.type]}
                />
                {o.location && (
                    <Fact
                        icon={<MapPinIcon className="h-4 w-4" />}
                        label="Location"
                        value={o.location}
                    />
                )}
                {o.salaryText && (
                    <Fact
                        icon={<BanknotesIcon className="h-4 w-4" />}
                        label="Pay"
                        value={o.salaryText}
                    />
                )}
                <Fact
                    icon={<CalendarDaysIcon className="h-4 w-4" />}
                    label="Saved by"
                    value={`${o.saveCount} ${o.saveCount === 1 ? "student" : "students"}`}
                />
            </dl>
        </div>
    );
}

function Fact({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2 text-white/50">
                {icon}
                {label}
            </dt>
            <dd className="text-right font-medium text-white">{value}</dd>
        </div>
    );
}
