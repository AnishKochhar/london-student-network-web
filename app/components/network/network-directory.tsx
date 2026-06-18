"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import SocietyNetworkCard from "./society-network-card";
import {
    filterSocieties,
    sortSocieties,
} from "@/app/lib/societies/selectors";
import {
    SOCIETY_TYPE_LABELS,
    type Society,
    type SocietyFilters,
    type SocietyType,
} from "@/app/lib/societies/types";

type UniOption = { id: string; shortName: string };

const selectClass =
    "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50";

export default function NetworkDirectory({
    societies,
    universities,
    categories,
    types,
}: {
    societies: Society[];
    universities: UniOption[];
    categories: string[];
    types: SocietyType[];
}) {
    const [search, setSearch] = useState("");
    const [universitySlug, setUniversitySlug] = useState<string>("all");
    const [type, setType] = useState<SocietyType | "all">("all");
    const [category, setCategory] = useState<string>("all");
    const [sort, setSort] = useState<SocietyFilters["sort"]>("featured");

    const results = useMemo(() => {
        const filtered = filterSocieties(societies, {
            search,
            universitySlug,
            type,
            category,
        });
        return sortSocieties(filtered, sort);
    }, [societies, search, universitySlug, type, category, sort]);

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search societies, e.g. debating, robotics, finance…"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-white/40 outline-none focus:border-sky-400/50"
                />
            </div>

            {/* University tabs */}
            <div className="flex flex-wrap gap-2">
                <Tab
                    active={universitySlug === "all"}
                    onClick={() => setUniversitySlug("all")}
                    label="All universities"
                />
                {universities.map((u) => (
                    <Tab
                        key={u.id}
                        active={universitySlug === u.id}
                        onClick={() => setUniversitySlug(u.id)}
                        label={u.shortName}
                    />
                ))}
            </div>

            {/* Filters + count */}
            <div className="flex flex-wrap items-center gap-3">
                <select
                    className={selectClass}
                    value={type}
                    onChange={(e) => setType(e.target.value as SocietyType | "all")}
                >
                    <option value="all" className="bg-[#083157]">
                        All types
                    </option>
                    {types.map((t) => (
                        <option key={t} value={t} className="bg-[#083157]">
                            {SOCIETY_TYPE_LABELS[t]}
                        </option>
                    ))}
                </select>
                <select
                    className={selectClass}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <option value="all" className="bg-[#083157]">
                        All categories
                    </option>
                    {categories.map((c) => (
                        <option key={c} value={c} className="bg-[#083157]">
                            {c}
                        </option>
                    ))}
                </select>
                <select
                    className={selectClass}
                    value={sort}
                    onChange={(e) =>
                        setSort(e.target.value as SocietyFilters["sort"])
                    }
                >
                    <option value="featured" className="bg-[#083157]">
                        Featured
                    </option>
                    <option value="name" className="bg-[#083157]">
                        A–Z
                    </option>
                    <option value="newest" className="bg-[#083157]">
                        Newest
                    </option>
                    <option value="activity" className="bg-[#083157]">
                        Most active
                    </option>
                </select>
                <span className="ml-auto text-sm text-white/50">
                    {results.length} societ{results.length === 1 ? "y" : "ies"}
                </span>
            </div>

            {/* Grid */}
            {results.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/60">
                    No societies match your filters yet.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((s) => (
                        <SocietyNetworkCard key={s.id} society={s} />
                    ))}
                </div>
            )}
        </div>
    );
}

function Tab({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                active
                    ? "border-sky-400/40 bg-sky-400/15 text-white"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
        >
            {label}
        </button>
    );
}
