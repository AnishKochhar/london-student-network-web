"use client";

import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/app/lib/utils";

type Props = {
    opportunityId: string;
    applyUrl?: string | null;
    variant?: "primary" | "subtle";
    label?: string;
    className?: string;
};

/**
 * Apply CTA that records an `apply_click` analytics event (fire-and-forget)
 * before opening the external application link in a new tab.
 */
export default function ApplyLink({
    opportunityId,
    applyUrl,
    variant = "primary",
    label = "Apply",
    className,
}: Props) {
    function track(e: React.MouseEvent) {
        e.stopPropagation();
        // Fire-and-forget — never block navigation on analytics.
        void fetch(`/api/opportunities/${opportunityId}/interactions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventType: "apply_click" }),
        }).catch(() => {});
    }

    if (!applyUrl) {
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-white/40",
                    className,
                )}
            >
                Link not available
            </span>
        );
    }

    return (
        <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={track}
            className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                variant === "primary"
                    ? "bg-gradient-to-r from-sky-400 to-emerald-400 text-[#04243f] hover:from-sky-300 hover:to-emerald-300 hover:shadow-lg hover:shadow-emerald-500/20"
                    : "border border-white/20 bg-white/5 text-white hover:bg-white/10",
                className,
            )}
        >
            {label}
            <ArrowUpRightIcon className="h-4 w-4" />
        </a>
    );
}
