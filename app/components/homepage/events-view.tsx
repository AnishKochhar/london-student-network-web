import { Event } from "@/app/lib/types"
import EventCard from "../events-page/event-card"
import { sortEventsByDate } from "@/app/lib/utils/events"

interface UpcomingEventsProps {
	events: Event[]
}

export default async function UpcomingEvents({ events }: UpcomingEventsProps) {

	const sortedEvents = sortEventsByDate(events)

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
			{sortedEvents.map((event, index) => (
				<EventCard key={index} event={event} />
			))}
		</div>
	)

}