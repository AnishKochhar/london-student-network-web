"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    MapPinIcon,
    BanknotesIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";
import type { Opportunity } from "@/app/lib/opportunities/types";
import { isRecentlyAdded } from "@/app/lib/opportunities/selectors";
import { avatarGradient, initials } from "./format";
import TypeBadge from "./type-badge";
import DeadlineBadge from "./deadline-badge";
import SaveButton from "./save-button";
import ApplyLink from "./apply-link";
import { cn } from "@/app/lib/utils";

type Props = {
    opportunity: Opportunity;
    saved: boolean;
    isLoggedIn: boolean;
    featured?: boolean;
};

export default function OpportunityCard({
    opportunity: o,
    saved,
    isLoggedIn,
    featured = false,
}: Props) {
    const href = `/jobs/${o.slug}`;
    const recent = isRecentlyAdded(o.publishedAt);

    return (
        <motion.article
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={cn(
                "group relative flex h-full flex-col rounded-2xl border bg-white/[0.04] p-5 backdrop-blur-sm transition-colors",
                featured
                    ? "border-emerald-400/25 bg-emerald-500/[0.06] hover:border-emerald-300/40"
                    : "border-white/10 hover:border-white/25 hover:bg-white/[0.07]",
            )}
        >
            {/* Stretched link makes the whole card clickable without nesting anchors */}
            <Link
                href={href}
                aria-label={`${o.title} at ${o.organisation}`}
                className="absolute inset-0 z-0 rounded-2xl"
            />

            {/* Save button sits above the stretched link */}
            <div className="absolute right-4 top-4 z-10">
                <SaveButton
                    opportunityId={o.id}
                    initialSaved={saved}
                    isLoggedIn={isLoggedIn}
                    returnTo={href}
                />
            </div>

            {/* Header: avatar + org */}
            <div className="flex items-center gap-3 pr-10">
                <div
                    className={cn(
                        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-inner",
                        avatarGradient(o.organisation),
                    )}
                >
                    {initials(o.organisation)}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/60">
                        {o.organisation}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                        {featured && (
                            <SparklesIcon className="h-3.5 w-3.5 text-emerald-300" />
                        )}
                        {recent && (
                            <span className="text-[11px] font-medium text-emerald-300">
                                Recently added
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Title */}
            <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-snug text-white">
                {o.title}
            </h3>

            {/* Meta row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
                {o.location && (
                    <span className="inline-flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        {o.location}
                    </span>
                )}
                {o.salaryText && (
                    <span className="inline-flex items-center gap-1">
                        <BanknotesIcon className="h-4 w-4" />
                        {o.salaryText}
                    </span>
                )}
            </div>

            {/* Summary */}
            {o.summary && (
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/70">
                    {o.summary}
                </p>
            )}

            {/* Badges */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
                <TypeBadge type={o.type} />
                <DeadlineBadge deadline={o.deadline} />
                {o.tags.slice(0, 2).map((tag) => (
                    <span
                        key={tag}
                        className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50 ring-1 ring-inset ring-white/10"
                    >
                        {tag}
                    </span>
                ))}
            </div>

            {/* Footer actions */}
            <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="relative z-10 text-sm font-medium text-white/70 transition-colors group-hover:text-white">
                    View details →
                </span>
                <ApplyLink
                    opportunityId={o.id}
                    applyUrl={o.applyUrl}
                    variant="subtle"
                    label="Apply"
                    className="relative z-10 px-3 py-1.5 text-xs"
                />
            </div>
        </motion.article>
    );
}
