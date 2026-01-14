"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Event } from "@/app/lib/types";
import TagButtons from "./event-tag-filters";
import { EVENT_TAG_TYPES } from "@/app/lib/utils";
import FilteredEventsList from "./filtered-events-list";
import EventSearchBar from "./event-search-bar";
import { SegmentedToggle } from "../ui/segmented-toggle";
import { useEventsPagination } from "@/app/hooks/useEventsPagination";
import { useDebounce } from "@/app/components/forum/hooks/useDebounce";
import LoadMoreTrigger from "./load-more-trigger";
import EventsLoadingSkeleton from "./events-loading-skeleton";
// University filter UI hidden for now - backend support ready
// import UniversityFilterBar from "./university-filter-bar";

interface FilteredEventsPageProps {
    allEvents: Event[];
    initialTotal?: number;
    editEvent?: boolean;
}

export default function FilteredEventsPage({
    allEvents,
    initialTotal,
    editEvent,
}: FilteredEventsPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize tags from URL or default to all
    const initialActiveTags = (() => {
        const tagsParam = searchParams.get("tags");
        if (tagsParam) {
            return tagsParam.split(",").map(Number).filter(n => !isNaN(n));
        }
        // Default: all tags active (empty array means no filter in API)
        return [];
    })();

    // Initialize other filters from URL
    const initialSearch = searchParams.get("search") || "";
    const initialSource = (searchParams.get("source") as "all" | "society" | "student_union") || "all";
    // University URL param - uncomment when enabling UI
    // const initialUniversities = (() => {
    //     const uniParam = searchParams.get("universities");
    //     if (uniParam) {
    //         return uniParam.split(",").filter(u => u.trim());
    //     }
    //     return [];
    // })();

    // Use pagination hook with initial data
    const {
        events,
        total,
        hasMore,
        isLoading,
        isLoadingMore,
        error,
        filters,
        loadMore,
        setSearch,
        setSource,
        toggleTag,
        setTags,
        // University filtering - uncomment when enabling UI
        // toggleUniversity,
        // setUniversities,
    } = useEventsPagination(allEvents, initialTotal ?? allEvents.length);

    // Local state for immediate UI feedback
    const [localSearchQuery, setLocalSearchQuery] = useState(initialSearch);
    const [localSource, setLocalSource] = useState(initialSource);
    const [localTags, setLocalTags] = useState<number[]>(initialActiveTags);
    // University state - uncomment when enabling UI
    // const [localUniversities, setLocalUniversities] = useState<string[]>(initialUniversities);

    // Debounce search to avoid excessive API calls
    const debouncedSearch = useDebounce(localSearchQuery, 300);

    // Sync debounced search with pagination hook
    useEffect(() => {
        if (debouncedSearch !== filters.search) {
            setSearch(debouncedSearch);
        }
    }, [debouncedSearch, filters.search, setSearch]);

    // Update URL when filters change
    const updateURL = useCallback((
        tags: number[],
        search: string,
        source: string,
        universities: string[]
    ) => {
        const params = new URLSearchParams();

        if (tags.length > 0) {
            params.set("tags", tags.join(","));
        }
        if (search.trim()) {
            params.set("search", search.trim());
        }
        if (source !== "all") {
            params.set("source", source);
        }
        if (universities.length > 0) {
            params.set("universities", universities.join(","));
        }

        const queryString = params.toString();
        const newPath = queryString ? `/events?${queryString}` : "/events";

        // Use replace to avoid building up history
        router.replace(newPath, { scroll: false });
    }, [router]);

    // Update URL when filters change (after initial mount)
    useEffect(() => {
        // Only update URL after filters have been applied (not on initial mount)
        if (filters.tags.length > 0 || filters.search || filters.source !== "all" || filters.universities.length > 0) {
            updateURL(filters.tags, filters.search, filters.source, filters.universities);
        }
    }, [filters.tags, filters.search, filters.source, filters.universities, updateURL]);

    // Handle tag toggle
    const handleToggleTag = useCallback((tag: number) => {
        setLocalTags(prev => {
            const newTags = prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag];
            return newTags;
        });
        toggleTag(tag);
    }, [toggleTag]);

    // Handle source change
    const handleSourceChange = useCallback((value: string) => {
        const source = value as "all" | "society" | "student_union";
        setLocalSource(source);
        setSource(source);
    }, [setSource]);

    // Handle "Select All" / "Deselect All" for tags
    const handleSelectAllTags = useCallback(() => {
        const allTagValues = Object.keys(EVENT_TAG_TYPES).map(tag => parseInt(tag, 10));
        const allSelected = allTagValues.every(tag => localTags.includes(tag));

        if (allSelected) {
            // Deselect all - this means "no filter" (show all)
            setLocalTags([]);
            setTags([]);
        } else {
            // Select all specific tags
            setLocalTags(allTagValues);
            setTags(allTagValues);
        }
    }, [localTags, setTags]);

    // University handlers - hidden for now, uncomment when enabling UI
    // const handleToggleUniversity = useCallback((code: string) => {
    //     setLocalUniversities(prev => {
    //         const newUnis = prev.includes(code)
    //             ? prev.filter(u => u !== code)
    //             : [...prev, code];
    //         return newUnis;
    //     });
    //     toggleUniversity(code);
    // }, [toggleUniversity]);

    // const handleSelectAllUniversities = useCallback(() => {
    //     if (localUniversities.length > 0) {
    //         setLocalUniversities([]);
    //         setUniversities([]);
    //     }
    // }, [localUniversities, setUniversities]);

    const segmentedToggleOptions = [
        { label: "All Events", value: "all" },
        { label: "Society Events", value: "society" },
        { label: "Student Union Events", value: "student_union" },
    ];

    // Calculate whether "all tags" should appear selected
    // Empty localTags means "no filter" (show all), which is effectively "all selected"
    const allTagValues = Object.keys(EVENT_TAG_TYPES).map(tag => parseInt(tag, 10));
    const effectiveActiveTags = localTags.length === 0 ? allTagValues : localTags;

    return (
        <>
            <EventSearchBar
                searchQuery={localSearchQuery}
                setSearchQuery={setLocalSearchQuery}
            />

            <div className="flex justify-center mb-6">
                <SegmentedToggle
                    options={segmentedToggleOptions}
                    value={localSource}
                    onValueChange={handleSourceChange}
                />
            </div>

            {/* University filter UI hidden for now - uncomment when ready
            <UniversityFilterBar
                activeUniversities={localUniversities}
                onToggle={handleToggleUniversity}
                onSelectAll={handleSelectAllUniversities}
            />
            */}

            <TagButtons
                activeTags={effectiveActiveTags}
                toggleTag={handleToggleTag}
                onSelectAll={handleSelectAllTags}
                showSelectAll={true}
            />

            {error && (
                <div className="text-center py-8">
                    <p className="text-red-400 mb-4">Error loading events: {error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            )}

            {isLoading ? (
                <EventsLoadingSkeleton count={12} />
            ) : (
                <>
                    <FilteredEventsList
                        allEvents={events}
                        activeTags={effectiveActiveTags}
                        editEvent={editEvent}
                        showAllEvents={true} // Server already filtered, no client filtering needed
                    />

                    <LoadMoreTrigger
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        isLoading={isLoadingMore}
                        totalShown={events.length}
                        total={total}
                    />
                </>
            )}
        </>
    );
}
