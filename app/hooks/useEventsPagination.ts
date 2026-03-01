"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Event } from "@/app/lib/types";

export interface PaginationFilters {
    tags: number[];
    search: string;
    source: "all" | "society" | "student_union";
    universities: string[]; // Array of university codes (empty = all universities)
}

export interface PaginationState {
    events: Event[];
    total: number;
    hasMore: boolean;
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
}

interface PaginatedResponse {
    success: boolean;
    events: Event[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
    appliedFilters: {
        tags: number[] | "all";
        search: string;
        source: string;
        universities: string[] | "all";
    };
    error?: string;
    message?: string;
}

interface CacheEntry {
    events: Event[];
    total: number;
    hasMore: boolean;
    timestamp: number;
}

const ITEMS_PER_PAGE = 30;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Generate cache key from filters
function getCacheKey(filters: PaginationFilters): string {
    const tagKey = filters.tags.length === 0 ? "all" : filters.tags.sort((a, b) => a - b).join(",");
    const uniKey = filters.universities.length === 0 ? "all" : filters.universities.sort().join(",");
    return `${tagKey}|${filters.search}|${filters.source}|${uniKey}`;
}

export function useEventsPagination(
    initialEvents: Event[] = [],
    initialTotal: number = 0
) {
    // State
    const [state, setState] = useState<PaginationState>({
        events: initialEvents,
        total: initialTotal,
        hasMore: initialEvents.length < initialTotal,
        isLoading: false,
        isLoadingMore: false,
        error: null,
    });

    const [filters, setFilters] = useState<PaginationFilters>({
        tags: [],
        search: "",
        source: "all",
        universities: [],
    });

    // Refs for caching and request tracking
    const cache = useRef<Map<string, CacheEntry>>(new Map());
    const abortControllerRef = useRef<AbortController | null>(null);
    const currentOffset = useRef(initialEvents.length);
    const isInitialMount = useRef(true);

    // Fetch events from API
    const fetchEvents = useCallback(async (
        filterParams: PaginationFilters,
        offset: number = 0,
        append: boolean = false
    ): Promise<void> => {
        // Cancel any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // Check cache for initial load (not load more)
        if (!append) {
            const cacheKey = getCacheKey(filterParams);
            const cached = cache.current.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
                setState(prev => ({
                    ...prev,
                    events: cached.events,
                    total: cached.total,
                    hasMore: cached.hasMore,
                    isLoading: false,
                    error: null,
                }));
                currentOffset.current = cached.events.length;
                return;
            }
        }

        setState(prev => ({
            ...prev,
            isLoading: !append,
            isLoadingMore: append,
            error: null,
        }));

        try {
            const params = new URLSearchParams({
                limit: ITEMS_PER_PAGE.toString(),
                offset: offset.toString(),
                source: filterParams.source,
            });

            if (filterParams.tags.length > 0) {
                params.set("tags", filterParams.tags.join(","));
            }

            if (filterParams.search.trim()) {
                params.set("search", filterParams.search.trim());
            }

            if (filterParams.universities.length > 0) {
                params.set("universities", filterParams.universities.join(","));
            }

            const response = await fetch(`/api/events/paginated?${params}`, {
                signal: abortControllerRef.current?.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: PaginatedResponse = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Failed to fetch events");
            }

            const newEvents = append
                ? [...state.events, ...data.events]
                : data.events;

            setState(prev => ({
                ...prev,
                events: newEvents,
                total: data.pagination.total,
                hasMore: data.pagination.hasMore,
                isLoading: false,
                isLoadingMore: false,
                error: null,
            }));

            currentOffset.current = newEvents.length;

            // Cache the result (only for initial loads, not appends)
            if (!append) {
                const cacheKey = getCacheKey(filterParams);
                cache.current.set(cacheKey, {
                    events: newEvents,
                    total: data.pagination.total,
                    hasMore: data.pagination.hasMore,
                    timestamp: Date.now(),
                });
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                // Request was cancelled, don't update state
                return;
            }

            console.error("Error fetching events:", error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                isLoadingMore: false,
                error: error instanceof Error ? error.message : "Failed to fetch events",
            }));
        }
    }, [state.events]);

    // Load more events (append to existing)
    const loadMore = useCallback(() => {
        if (state.isLoadingMore || !state.hasMore) return;
        fetchEvents(filters, currentOffset.current, true);
    }, [fetchEvents, filters, state.isLoadingMore, state.hasMore]);

    // Update filters and refetch
    const updateFilters = useCallback((newFilters: Partial<PaginationFilters>) => {
        setFilters(prev => {
            const updated = { ...prev, ...newFilters };
            // Reset offset when filters change
            currentOffset.current = 0;
            // Fetch with new filters (will reset events)
            fetchEvents(updated, 0, false);
            return updated;
        });
    }, [fetchEvents]);

    // Set specific tag filters
    const setTags = useCallback((tags: number[]) => {
        updateFilters({ tags });
    }, [updateFilters]);

    // Set search query
    const setSearch = useCallback((search: string) => {
        updateFilters({ search });
    }, [updateFilters]);

    // Set event source filter
    const setSource = useCallback((source: "all" | "society" | "student_union") => {
        updateFilters({ source });
    }, [updateFilters]);

    // Toggle a single tag
    const toggleTag = useCallback((tag: number) => {
        setFilters(prev => {
            const newTags = prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag];

            const updated = { ...prev, tags: newTags };
            currentOffset.current = 0;
            fetchEvents(updated, 0, false);
            return updated;
        });
    }, [fetchEvents]);

    // Set universities filter
    const setUniversities = useCallback((universities: string[]) => {
        updateFilters({ universities });
    }, [updateFilters]);

    // Toggle a single university
    const toggleUniversity = useCallback((code: string) => {
        setFilters(prev => {
            const newUniversities = prev.universities.includes(code)
                ? prev.universities.filter(u => u !== code)
                : [...prev.universities, code];

            const updated = { ...prev, universities: newUniversities };
            currentOffset.current = 0;
            fetchEvents(updated, 0, false);
            return updated;
        });
    }, [fetchEvents]);

    // Refetch current data
    const refetch = useCallback(() => {
        currentOffset.current = 0;
        // Clear cache for current filters
        const cacheKey = getCacheKey(filters);
        cache.current.delete(cacheKey);
        fetchEvents(filters, 0, false);
    }, [fetchEvents, filters]);

    // Clear cache
    const clearCache = useCallback(() => {
        cache.current.clear();
    }, []);

    // Effect to fetch data when filters change (after initial mount)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        // fetchEvents is called directly in updateFilters/toggleTag, so we don't need this effect
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        // State
        events: state.events,
        total: state.total,
        hasMore: state.hasMore,
        isLoading: state.isLoading,
        isLoadingMore: state.isLoadingMore,
        error: state.error,
        filters,

        // Actions
        loadMore,
        setTags,
        setSearch,
        setSource,
        toggleTag,
        setUniversities,
        toggleUniversity,
        refetch,
        clearCache,
        updateFilters,
    };
}
