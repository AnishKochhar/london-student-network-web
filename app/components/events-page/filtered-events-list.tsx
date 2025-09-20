"use client";
import EventSection from "./event-section";
import { Event } from "@/app/lib/types";
import { convertEventsToMonthYearGroupings } from "@/app/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FilteredEventsListProps {
    allEvents: Event[];
    activeTags: number[];
    editEvent?: boolean;
}

export default function FilteredEventsList({
    allEvents,
    activeTags,
    editEvent,
}: FilteredEventsListProps) {
    const filteredEvents = allEvents.filter((event) => {
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
        return dateB.getTime() - dateA.getTime(); // Reversed: most recent first
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
                        <p className="text-2xl text-gray-400 mb-4">No events found with selected filters</p>
                        <p className="text-gray-500">Try selecting different tags to see more events</p>
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
                                />
                            </motion.div>
                        );
                    })
                )}
            </motion.div>
        </AnimatePresence>
    );
}
