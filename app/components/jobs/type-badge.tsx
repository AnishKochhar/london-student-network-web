import { cn } from "@/app/lib/utils";
import {
    OPPORTUNITY_TYPE_LABELS,
    type OpportunityType,
} from "@/app/lib/opportunities/types";

const STYLES: Record<OpportunityType, string> = {
    internship: "bg-sky-500/15 text-sky-200 ring-sky-400/30",
    graduate: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
    placement: "bg-violet-500/15 text-violet-200 ring-violet-400/30",
    part_time: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    full_time: "bg-blue-500/15 text-blue-200 ring-blue-400/30",
    volunteer: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
    event: "bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30",
    other: "bg-white/10 text-white/70 ring-white/20",
};

export default function TypeBadge({
    type,
    className,
}: {
    type: OpportunityType;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                STYLES[type] ?? STYLES.other,
                className,
            )}
        >
            {OPPORTUNITY_TYPE_LABELS[type] ?? "Opportunity"}
        </span>
    );
}
