import { Event } from "@/app/lib/types";
import EventCard from "./event-card";
import { sortEventsByDate } from "@/app/lib/utils/events";
import { getMonthName } from "@/app/lib/utils/time";

interface EventSectionProps {
	month: string
	year: string
	events: Event[]
	editEvent?: boolean
}


export default function EventSection({ month, year, events, editEvent }: EventSectionProps) {
	
	const sortedEvents = sortEventsByDate(events)

	return (
		<section className="mb-8">
			<h2 className="text-3xl font-semibold mb-4 capitalize">{getMonthName(month)} {year}</h2>
			<div className="border-b border-gray-400 mb-4" />
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{sortedEvents.map((event, index) => (
					<EventCard key={index} event={event} editEvent={editEvent} />
				))}
			</div>
		</section>

	)
}