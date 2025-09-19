import { useState, useEffect, useCallback, useRef } from "react";
import { ForumPost } from "@/app/lib/types";
import { useInfiniteScroll } from "./useInfiniteScroll";
import { ActiveFilter } from "../forum-controls";

// Constants for pagination
const INITIAL_FETCH_COUNT = 6;
const LOAD_MORE_COUNT = 3;

export function useForumThreads(
    searchTerm: string,
    sortBy: string,
    activeFilters: ActiveFilter[] = [],
) {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(true);

    // Use a ref to prevent duplicate API calls
    const isFetchingRef = useRef<boolean>(false);
    const searchTermRef = useRef<string>(searchTerm);
    const sortByRef = useRef<string>(sortBy);
    const activeFiltersRef = useRef<ActiveFilter[]>(activeFilters);

    // Fetch initial threads
    const fetchThreads = useCallback(async () => {
        // Prevent duplicate calls
        if (isFetchingRef.current) return;
        isFetchingRef.current = true;

        try {
            setIsLoading(true);
            setError(null);

            const url = new URL("/api/threads", window.location.origin);
            url.searchParams.append("page", "1");
            url.searchParams.append("limit", INITIAL_FETCH_COUNT.toString());
            url.searchParams.append("sort", sortBy);

            if (searchTerm) {
                url.searchParams.append("search", searchTerm);
            }

            // Add filters to URL
            activeFilters.forEach((filter) => {
                if (filter.type === "tag") {
                    url.searchParams.append("tags", filter.value);
                } else if (filter.type === "author") {
                    url.searchParams.append("author", filter.value);
                } else if (filter.type === "myThreads") {
                    url.searchParams.append("myThreads", "true");
                }
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch threads");
            }

            const data = await response.json();

            const transformedThreads = (data.threads || []).map((thread) => ({
                ...thread,
                // Set default replyCount to 0 if it doesn't exist
                replyCount:
                    thread.replyCount !== undefined ? thread.replyCount : 0,
            }));

            setPosts(transformedThreads);
            setHasMorePosts(data.pagination?.hasMore || false);
            setPage(1);

            // Update refs
            searchTermRef.current = searchTerm;
            sortByRef.current = sortBy;
            activeFiltersRef.current = activeFilters;
        } catch (err) {
            console.error("Error fetching threads:", err);
            setError("Failed to load forum threads. Please try again later.");
            setPosts([]);
        } finally {
            setIsLoading(false);
            isFetchingRef.current = false;
        }
    }, [searchTerm, sortBy, activeFilters]);

    // Fetch more threads when scrolling
    const fetchMoreThreads = useCallback(async () => {
        // Don't fetch if already loading, no more posts, or already fetching
        if (isLoadingMore || !hasMorePosts || isFetchingRef.current) return;

        isFetchingRef.current = true;
        setIsLoadingMore(true);

        try {
            const nextPage = page + 1; // Calculate next page instead of using state directly

            const url = new URL("/api/threads", window.location.origin);
            url.searchParams.append("page", nextPage.toString());
            url.searchParams.append("limit", LOAD_MORE_COUNT.toString());
            url.searchParams.append("sort", sortBy);

            if (searchTerm) {
                url.searchParams.append("search", searchTerm);
            }

            // Add filters to URL
            activeFilters.forEach((filter) => {
                if (filter.type === "tag") {
                    url.searchParams.append("tags", filter.value);
                } else if (filter.type === "author") {
                    url.searchParams.append("author", filter.value);
                } else if (filter.type === "myThreads") {
                    url.searchParams.append("myThreads", "true");
                }
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch more threads");
            }

            const data = await response.json();

            // Only update if search params haven't changed
            if (
                searchTerm === searchTermRef.current &&
                sortBy === sortByRef.current &&
                activeFilters === activeFiltersRef.current
            ) {
                const transformedThreads = (data.threads || []).map(
                    (thread) => ({
                        ...thread,
                        replyCount:
                            thread.replyCount !== undefined
                                ? thread.replyCount
                                : 0,
                    }),
                );

                setPosts((prev) => [...prev, ...transformedThreads]);
                setHasMorePosts(data.pagination?.hasMore || false);
                setPage(nextPage); // Update page only after successful fetch
            }
        } catch (err) {
            console.error("Error fetching more threads:", err);
        } finally {
            setIsLoadingMore(false);
            isFetchingRef.current = false;
        }
    }, [page, searchTerm, sortBy, activeFilters, hasMorePosts, isLoadingMore]);

    // Function to load more posts
    const loadMorePosts = useCallback(() => {
        if (!isLoadingMore && hasMorePosts && !isFetchingRef.current) {
            fetchMoreThreads();
        }
    }, [fetchMoreThreads, isLoadingMore, hasMorePosts]);

    // Initial data fetch - only run once
    useEffect(() => {
        fetchThreads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array for initial load only

    // Handle search/sort/filter changes with a separate effect
    useEffect(() => {
        // Only refetch if search term, sort order, or filters have actually changed
        if (
            searchTerm !== searchTermRef.current ||
            sortBy !== sortByRef.current ||
            activeFilters !== activeFiltersRef.current
        ) {
            fetchThreads();
        }
    }, [searchTerm, sortBy, activeFilters, fetchThreads]);

    // Setup infinite scrolling with a manual trigger rather than automatic
    const loaderRef = useInfiniteScroll({
        hasMore: hasMorePosts,
        isLoading: isLoading || isLoadingMore,
        onLoadMore: loadMorePosts,
    });

    return {
        posts,
        setPosts,
        isLoading,
        error,
        page,
        hasMorePosts,
        isLoadingMore,
        loaderRef,
        loadMorePosts,
        fetchThreads,
    };
}
