"use server"

import { fetchUpcomingEvents } from "@/app/lib/data"
import { sortEventsByDate } from "@/app/lib/utils/events";
import UpcomingEventsView from "./upcoming-events"

export default async function UpcomingEventsSection() {
	const allEvents = await fetchUpcomingEvents()
	const sortedEvents = sortEventsByDate(allEvents)
	
	return (
		<section className="flex flex-col items-center justify-center min-h-screen snap-start p-10">
			<h2 className="text-4xl sm:text-5xl font-bold text-white mb-12 text-center">Upcoming Events</h2>
			<UpcomingEventsView events={sortedEvents} />
		</section>
	)
}
