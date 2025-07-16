"use client"

import type { Event } from "@/app/lib/types"
import EventCard from "../events-page/event-card"
import { motion } from "framer-motion"

export default function UpcomingEventsView({ events }: { events: Event[] }) {
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.3,
			},
		},
	}

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
	}

	return (
		<motion.div
			className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4" // Changed to grid for consistent width
			variants={containerVariants}
			initial="hidden"
			whileInView="visible"
			viewport={{ once: true, amount: 0.5 }}
		>
			{events.length > 0 ? (
				events.map((event) => (
					<motion.div key={event.id} variants={itemVariants} className="w-full max-w-sm mx-auto">
						{" "}
						<EventCard event={event} />
					</motion.div>
				))
			) : (
				<p className="text-white">No upcoming events.</p>
			)}
		</motion.div>
	)
}
