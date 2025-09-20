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
    onEventUpdate?: () => void;
}

export default function EventSection({
    month,
    year,
    events,
    editEvent,
    onEventUpdate,
}: EventSectionProps) {
    const sortedEvents = sortEventsByDate(events);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    return (
        <section className="mb-8">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <h2 className="text-3xl font-semibold mb-4 capitalize">
                    {getMonthName(month)} {year}
                </h2>
                <div className="border-b border-gray-400 mb-4" />
            </motion.div>

            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {sortedEvents.map((event, index) => (
                    <motion.div
                        key={event.id || index}
                        variants={itemVariants}
                        whileHover={{
                            scale: 1.03,
                            transition: { duration: 0.2 }
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <EventCard
                            event={event}
                            editEvent={editEvent}
                            onEventUpdate={onEventUpdate}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
