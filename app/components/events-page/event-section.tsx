"use client";
import { Event } from "@/app/lib/types";
import EventCard from "./event-card";
import { getMonthName, sortEventsByDate } from "@/app/lib/utils";
import { motion } from "framer-motion";

interface EventSectionProps {
    month: string;
    year: string;
    events: Event[];
    editEvent?: boolean;
    reverseOrder?: boolean;
    startIndex?: number; // Global index offset for lazy loading optimization
}

// Animation constants - optimized for performance
const MAX_ANIMATED_ITEMS = 12; // Only animate first 12 items per section
const STAGGER_DELAY = 0.04; // Reduced from 0.08 for snappier feel

export default function EventSection({
    month,
    year,
    events,
    editEvent,
    reverseOrder = false,
    startIndex = 0,
}: EventSectionProps) {
    const sortedEvents = sortEventsByDate(events, reverseOrder);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: STAGGER_DELAY,
                delayChildren: 0.05
            }
        }
    };

    // Simpler animation for better performance
    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "tween",
                duration: 0.25,
                ease: "easeOut"
            }
        }
    };

    // Skip animation entirely for items beyond the threshold
    const shouldAnimate = (localIndex: number) => localIndex < MAX_ANIMATED_ITEMS;

    return (
        <section className="mb-8">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <h2 className="text-3xl font-semibold mb-4 capitalize text-white flex items-baseline gap-3">
                    <span>{getMonthName(month)} {year}</span>
                    <span className="text-base font-normal text-white/50">
                        ({sortedEvents.length} {sortedEvents.length === 1 ? 'event' : 'events'})
                    </span>
                </h2>
                <div className="border-b border-white/30 mb-4" />
            </motion.div>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {sortedEvents.map((event, localIndex) => {
                    const globalIndex = startIndex + localIndex;
                    const animate = shouldAnimate(localIndex);

                    return (
                        <motion.div
                            key={event.id || localIndex}
                            variants={animate ? itemVariants : undefined}
                            initial={animate ? "hidden" : false}
                            animate={animate ? "visible" : false}
                            whileHover={{
                                scale: 1.02,
                                transition: { duration: 0.15 }
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <EventCard
                                event={event}
                                editEvent={editEvent}
                                index={globalIndex}
                            />
                        </motion.div>
                    );
                })}
            </motion.div>
        </section>
    );
}
