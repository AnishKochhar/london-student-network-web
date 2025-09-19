import { useEffect, useRef } from "react";

interface UseInfiniteScrollProps {
    hasMore: boolean;
    isLoading: boolean;
    onLoadMore: () => void;
    rootMargin?: string;
    threshold?: number;
}

export function useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore,
    rootMargin = "200px",
    threshold = 0.1,
}: UseInfiniteScrollProps) {
    const loaderRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            { threshold, rootMargin },
        );

        if (loaderRef.current) {
            observerRef.current.observe(loaderRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, isLoading, onLoadMore, rootMargin, threshold]);

    return loaderRef;
}
