"use client";
import EventSection from "./event-section";
import { Event } from "@/app/lib/types";
import { convertEventsToMonthYearGroupings } from "@/app/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FilteredEventsListProps {
    allEvents: Event[];
    activeTags: number[];
    editEvent?: boolean;
    reverseOrder?: boolean; // For account page - show most recent first
    showAllEvents?: boolean; // When true, bypasses tag filtering entirely
}

export default function FilteredEventsList({
    allEvents,
    activeTags,
    editEvent,
    reverseOrder = false,
    showAllEvents = false,
}: FilteredEventsListProps) {
    const filteredEvents = showAllEvents
        ? allEvents
        : allEvents.filter((event) => {
            // Only return events where at least one of the active tags is present
            return activeTags.some((tag) => (event.event_type & tag) === tag);
        });

    const monthYearGroupings =
        convertEventsToMonthYearGroupings(filteredEvents);
    const sortedMonthYearKeys = Object.keys(monthYearGroupings).sort((a, b) => {
        const [monthA, yearA] = a.split("/");
        const [monthB, yearB] = b.split("/");
        const dateA = new Date(`${yearA}-${monthA}-01`);
        const dateB = new Date(`${yearB}-${monthB}-01`);
        // Use reverse order for account page (furthest future first), normal order for events page
        return reverseOrder
            ? dateB.getTime() - dateA.getTime()  // Descending: Dec 2025 before Nov 2025 (furthest future first)
            : dateA.getTime() - dateB.getTime();  // Ascending: Chronological order (events page)
    });

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={activeTags.join(",")}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                    duration: 0.3,
                    ease: "easeInOut"
                }}
            >
                {sortedMonthYearKeys.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4 }}
                        className="text-center py-16"
                    >
                        <p className="text-2xl text-white/60 mb-4">No events found with selected filters</p>
                        <p className="text-white/40">Try selecting different tags to see more events</p>
                    </motion.div>
                ) : (
                    sortedMonthYearKeys.map((monthYearKey, index) => {
                        const [month, year] = monthYearKey.split("/");
                        return (
                            <motion.div
                                key={monthYearKey}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.5,
                                    delay: index * 0.1,
                                    ease: "easeOut"
                                }}
                            >
                                <EventSection
                                    month={month}
                                    year={year}
                                    events={monthYearGroupings[monthYearKey]}
                                    editEvent={editEvent}
                                    reverseOrder={reverseOrder}
                                />
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </AnimatePresence>
    );
}
