"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface LoadMoreTriggerProps {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    totalShown: number;
    total: number;
}

export default function LoadMoreTrigger({
    onLoadMore,
    hasMore,
    isLoading,
    totalShown,
    total,
}: LoadMoreTriggerProps) {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const trigger = triggerRef.current;
        if (!trigger || !hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (entry.isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            {
                rootMargin: "400px", // Start loading before user reaches the trigger
                threshold: 0,
            }
        );

        observer.observe(trigger);

        return () => {
            observer.disconnect();
        };
    }, [onLoadMore, hasMore, isLoading]);

    if (!hasMore && totalShown === total) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
            >
                <p className="text-white/50">
                    Showing all {total} events
                </p>
            </motion.div>
        );
    }

    return (
        <div ref={triggerRef} className="py-8">
            {isLoading && (
                <div className="flex flex-col items-center gap-4">
                    <LoadingSpinner />
                    <p className="text-white/60 text-sm">
                        Loading more events...
                    </p>
                </div>
            )}
            {hasMore && !isLoading && (
                <div className="text-center">
                    <p className="text-white/40 text-sm mb-2">
                        Showing {totalShown} of {total} events
                    </p>
                    <button
                        onClick={onLoadMore}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                    >
                        Load More
                    </button>
                </div>
            )}
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center gap-2">
            <motion.div
                className="w-2 h-2 rounded-full bg-white/60"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
            />
            <motion.div
                className="w-2 h-2 rounded-full bg-white/60"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
                className="w-2 h-2 rounded-full bg-white/60"
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            />
        </div>
    );
}
