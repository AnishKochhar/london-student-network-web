"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    MagnifyingGlassIcon,
    XMarkIcon,
    SparklesIcon,
    FireIcon,
    Squares2X2Icon,
    BoltIcon,
    HeartIcon,
} from "@heroicons/react/24/outline";
import {
    filterOpportunities,
    sortOpportunities,
    deriveSections,
    trending,
} from "@/app/lib/opportunities/selectors";
import {
    OPPORTUNITY_TYPE_LABELS,
    type Opportunity,
    type OpportunityType,
    type OpportunityLocationType,
    type OpportunityFilters,
} from "@/app/lib/opportunities/types";
import { cn } from "@/app/lib/utils";
import OpportunityCard from "./opportunity-card";
import EmptyState from "./empty-state";

type SortKey = NonNullable<OpportunityFilters["sort"]>;

type Props = {
    initialOpportunities: Opportunity[];
    savedIds: string[];
    isLoggedIn: boolean;
    /** Personalized picks (server-computed); empty hides the rail. */
    recommended?: Opportunity[];
    initialFilters?: {
        search?: string;
        type?: string;
        locationType?: string;
        sort?: string;
    };
};

const LOCATION_OPTIONS: { value: OpportunityLocationType | "all"; label: string }[] = [
    { value: "all", label: "Any location" },
    { value: "on_site", label: "On-site" },
    { value: "hybrid", label: "Hybrid" },
    { value: "remote", label: "Remote" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "trending", label: "Trending" },
    { value: "deadline", label: "Closing soonest" },
    { value: "featured", label: "Featured first" },
];

export default function JobsBrowser({
    initialOpportunities,
    savedIds,
    isLoggedIn,
    recommended = [],
    initialFilters,
}: Props) {
    const [search, setSearch] = useState(initialFilters?.search ?? "");
    const [type, setType] = useState<OpportunityType | "all">(
        (initialFilters?.type as OpportunityType) ?? "all",
    );
    const [locationType, setLocationType] = useState<
        OpportunityLocationType | "all"
    >((initialFilters?.locationType as OpportunityLocationType) ?? "all");
    const [sort, setSort] = useState<SortKey>(
        (initialFilters?.sort as SortKey) ?? "newest",
    );

    const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

    const presentTypes = useMemo(() => {
        const set = new Set<OpportunityType>();
        for (const o of initialOpportunities) set.add(o.type);
        return Array.from(set);
    }, [initialOpportunities]);

    const sections = useMemo(
        () => deriveSections(initialOpportunities),
        [initialOpportunities],
    );

    const trendingList = useMemo(
        () => trending(initialOpportunities).slice(0, 6),
        [initialOpportunities],
    );

    const filtered = useMemo(
        () =>
            sortOpportunities(
                filterOpportunities(initialOpportunities, {
                    search,
                    type,
                    locationType,
                }),
                sort,
            ),
        [initialOpportunities, search, type, locationType, sort],
    );

    const isFiltering =
        search.trim() !== "" || type !== "all" || locationType !== "all";

    // Keep the URL shareable without triggering navigation/Suspense.
    useEffect(() => {
        const params = new URLSearchParams();
        if (search.trim()) params.set("search", search.trim());
        if (type !== "all") params.set("type", type);
        if (locationType !== "all") params.set("location", locationType);
        if (sort !== "newest") params.set("sort", sort);
        const qs = params.toString();
        window.history.replaceState(null, "", qs ? `/jobs?${qs}` : "/jobs");
    }, [search, type, locationType, sort]);

    const orgCount = useMemo(
        () => new Set(initialOpportunities.map((o) => o.organisation)).size,
        [initialOpportunities],
    );

    function clearAll() {
        setSearch("");
        setType("all");
        setLocationType("all");
        setSort("newest");
    }

    return (
        <div>
            {/* ---- Hero ---- */}
            <section className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
                    <div className="absolute -top-10 right-1/4 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
                </div>

                <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:pt-20 md:px-6">
                    <div className="mx-auto max-w-3xl text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                            <SparklesIcon className="h-3.5 w-3.5 text-emerald-300" />
                            London students &amp; graduates
                        </span>
                        <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                            Find your next{" "}
                            <span className="bg-gradient-to-r from-sky-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent">
                                opportunity
                            </span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-base text-white/60 sm:text-lg">
                            Internships, graduate roles, placements and part-time
                            work — curated for London students. Save the ones you
                            love and come back any time.
                        </p>

                        {/* Search */}
                        <div className="mx-auto mt-8 max-w-2xl">
                            <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] p-2 backdrop-blur focus-within:border-sky-400/50">
                                <MagnifyingGlassIcon className="ml-2 h-5 w-5 flex-shrink-0 text-white/50" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search roles, companies, skills…"
                                    className="w-full bg-transparent py-2 text-white placeholder-white/40 outline-none"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch("")}
                                        aria-label="Clear search"
                                        className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stat chips */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
                            <span>
                                <strong className="text-white">
                                    {initialOpportunities.length}
                                </strong>{" "}
                                live opportunities
                            </span>
                            <span>
                                <strong className="text-white">{orgCount}</strong>{" "}
                                organisations
                            </span>
                            <span className="hidden sm:inline">Updated daily</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---- Command bar ---- */}
            <section className="sticky top-[56px] z-20 border-y border-white/10 bg-[#041A2E]/80 backdrop-blur-md">
                <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Chip
                            active={type === "all"}
                            onClick={() => setType("all")}
                        >
                            All types
                        </Chip>
                        {presentTypes.map((t) => (
                            <Chip
                                key={t}
                                active={type === t}
                                onClick={() => setType(type === t ? "all" : t)}
                            >
                                {OPPORTUNITY_TYPE_LABELS[t]}
                            </Chip>
                        ))}

                        <div className="mx-1 hidden h-5 w-px bg-white/10 sm:block" />

                        <select
                            value={locationType}
                            onChange={(e) =>
                                setLocationType(
                                    e.target.value as OpportunityLocationType | "all",
                                )
                            }
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 outline-none hover:bg-white/10"
                        >
                            {LOCATION_OPTIONS.map((o) => (
                                <option
                                    key={o.value}
                                    value={o.value}
                                    className="bg-[#041A2E]"
                                >
                                    {o.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortKey)}
                            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/80 outline-none hover:bg-white/10"
                        >
                            {SORT_OPTIONS.map((o) => (
                                <option
                                    key={o.value}
                                    value={o.value}
                                    className="bg-[#041A2E]"
                                >
                                    Sort: {o.label}
                                </option>
                            ))}
                        </select>

                        {isFiltering && (
                            <button
                                onClick={clearAll}
                                className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-white/60 hover:text-white"
                            >
                                <XMarkIcon className="h-4 w-4" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* ---- Content ---- */}
            <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
                {isFiltering ? (
                    <Results
                        list={filtered}
                        savedSet={savedSet}
                        isLoggedIn={isLoggedIn}
                        onClear={clearAll}
                    />
                ) : (
                    <div className="space-y-14">
                        {recommended.length > 0 && (
                            <SectionBlock
                                title="Recommended for you"
                                icon={
                                    <HeartIcon className="h-5 w-5 text-rose-300" />
                                }
                            >
                                <Grid
                                    list={recommended}
                                    savedSet={savedSet}
                                    isLoggedIn={isLoggedIn}
                                />
                            </SectionBlock>
                        )}

                        {sections.featured.length > 0 && (
                            <SectionBlock
                                title="Featured opportunities"
                                icon={
                                    <SparklesIcon className="h-5 w-5 text-emerald-300" />
                                }
                            >
                                <Grid
                                    list={sections.featured}
                                    savedSet={savedSet}
                                    isLoggedIn={isLoggedIn}
                                    featured
                                />
                            </SectionBlock>
                        )}

                        {sections.closingSoon.length > 0 && (
                            <SectionBlock
                                title="Closing soon"
                                icon={<FireIcon className="h-5 w-5 text-rose-300" />}
                            >
                                <Grid
                                    list={sections.closingSoon}
                                    savedSet={savedSet}
                                    isLoggedIn={isLoggedIn}
                                />
                            </SectionBlock>
                        )}

                        {trendingList.length > 0 && (
                            <SectionBlock
                                title="Trending"
                                icon={<BoltIcon className="h-5 w-5 text-amber-300" />}
                            >
                                <Grid
                                    list={trendingList}
                                    savedSet={savedSet}
                                    isLoggedIn={isLoggedIn}
                                />
                            </SectionBlock>
                        )}

                        <SectionBlock
                            title="Browse all opportunities"
                            icon={
                                <Squares2X2Icon className="h-5 w-5 text-sky-300" />
                            }
                            count={filtered.length}
                        >
                            <Grid
                                list={filtered}
                                savedSet={savedSet}
                                isLoggedIn={isLoggedIn}
                            />
                        </SectionBlock>
                    </div>
                )}
            </div>
        </div>
    );
}

function Chip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                    ? "border-transparent bg-white text-[#041A2E]"
                    : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
            )}
        >
            {children}
        </button>
    );
}

function SectionBlock({
    title,
    icon,
    count,
    children,
}: {
    title: string;
    icon?: React.ReactNode;
    count?: number;
    children: React.ReactNode;
}) {
    return (
        <section>
            <div className="mb-5 flex items-center gap-2">
                {icon}
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                {count !== undefined && (
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-sm text-white/50">
                        {count}
                    </span>
                )}
            </div>
            {children}
        </section>
    );
}

function Grid({
    list,
    savedSet,
    isLoggedIn,
    featured = false,
}: {
    list: Opportunity[];
    savedSet: Set<string>;
    isLoggedIn: boolean;
    featured?: boolean;
}) {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((o, i) => (
                <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
                >
                    <OpportunityCard
                        opportunity={o}
                        saved={savedSet.has(o.id)}
                        isLoggedIn={isLoggedIn}
                        featured={featured}
                    />
                </motion.div>
            ))}
        </div>
    );
}

function Results({
    list,
    savedSet,
    isLoggedIn,
    onClear,
}: {
    list: Opportunity[];
    savedSet: Set<string>;
    isLoggedIn: boolean;
    onClear: () => void;
}) {
    if (list.length === 0) {
        return (
            <EmptyState
                title="No opportunities match your filters"
                description="Try a different search term or clear your filters to see everything."
                icon={<MagnifyingGlassIcon className="h-7 w-7" />}
                action={{ label: "Clear filters", href: "/jobs" }}
            />
        );
    }
    return (
        <div>
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                    {list.length} result{list.length === 1 ? "" : "s"}
                </h2>
                <button
                    onClick={onClear}
                    className="text-sm text-white/60 hover:text-white"
                >
                    Clear filters
                </button>
            </div>
            <Grid list={list} savedSet={savedSet} isLoggedIn={isLoggedIn} />
        </div>
    );
}
