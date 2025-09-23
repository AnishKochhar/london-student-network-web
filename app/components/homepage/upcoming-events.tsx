"use client";

import type { Event } from "@/app/lib/types";
import EventCard from "../events-page/event-card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function UpcomingEventsView({ events }: { events: Event[] }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
            },
        },
    };

    const itemVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut",
            },
        },
    };

    // Simplified version for mobile to avoid animation issues
    if (isMobile) {
        return (
            <div className="grid grid-cols-1 gap-8 px-4 w-full max-w-7xl mx-auto">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div
                            key={event.id}
                            className="w-full max-w-sm mx-auto"
                        >
                            <EventCard event={event} />
                        </div>
                    ))
                ) : (
                    <p className="text-white text-center">No upcoming events.</p>
                )}
            </div>
        );
    }

    return (
        <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 px-4 w-full max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            {events.length > 0 ? (
                events.map((event) => (
                    <motion.div
                        key={event.id}
                        variants={itemVariants}
                        className="w-full max-w-sm mx-auto"
                    >
                        <EventCard event={event} />
                    </motion.div>
                ))
            ) : (
                <p className="text-white text-center">No upcoming events.</p>
            )}
        </motion.div>
    );
}
