"use client";

import { motion } from "framer-motion";

interface EventsLoadingSkeletonProps {
    count?: number;
}

export default function EventsLoadingSkeleton({ count = 12 }: EventsLoadingSkeletonProps) {
    return (
        <div className="space-y-8">
            {/* Month section skeleton */}
            <section>
                <div className="mb-4">
                    <div className="h-9 w-48 bg-white/10 rounded-lg animate-pulse" />
                    <div className="border-b border-white/30 mt-4 mb-4" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {Array.from({ length: count }).map((_, index) => (
                        <EventCardSkeleton key={index} index={index} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function EventCardSkeleton({ index }: { index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
            className="bg-white/5 rounded-xl overflow-hidden backdrop-blur-sm border border-white/10"
        >
            {/* Image skeleton */}
            <div className="relative aspect-[4/3] bg-white/10 animate-pulse">
                {/* Gradient overlay like actual cards */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <div className="h-5 bg-white/10 rounded animate-pulse w-3/4" />

                {/* Organiser */}
                <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />

                {/* Date and time */}
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 bg-white/10 rounded animate-pulse w-32" />
                </div>

                {/* Location */}
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 bg-white/10 rounded animate-pulse w-40" />
                </div>

                {/* Tags */}
                <div className="flex gap-2 pt-2">
                    <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-6 w-20 bg-white/10 rounded-full animate-pulse" />
                </div>
            </div>
        </motion.div>
    );
}

// Smaller inline skeleton for load more state
export function LoadMoreSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mt-4">
            {Array.from({ length: count }).map((_, index) => (
                <EventCardSkeleton key={`loadmore-${index}`} index={index} />
            ))}
        </div>
    );
}
