"use client";

import { ClockIcon } from "@heroicons/react/24/outline";
import { cn } from "@/app/lib/utils";
import {
    getDeadlineUrgency,
    type DeadlineUrgencyLevel,
} from "@/app/lib/opportunities/selectors";

const STYLES: Record<DeadlineUrgencyLevel, string> = {
    urgent: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
    soon: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    normal: "bg-white/10 text-white/70 ring-white/15",
    none: "bg-white/5 text-white/40 ring-white/10",
    closed: "bg-gray-500/15 text-gray-300 ring-gray-400/20",
};

export default function DeadlineBadge({
    deadline,
    className,
}: {
    deadline?: string | null;
    className?: string;
}) {
    const urgency = getDeadlineUrgency(deadline);
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                STYLES[urgency.level],
                className,
            )}
        >
            <ClockIcon className="h-3.5 w-3.5" />
            {urgency.label}
        </span>
    );
}
