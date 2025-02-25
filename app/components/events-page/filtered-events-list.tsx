"use client";
import EventSection from './event-section';
import { Event } from '@/app/lib/types';
import { convertEventsToMonthYearGroupings } from '@/app/lib/utils/events';

interface FilteredEventsListProps {
	allEvents: Event[];
	activeTags: number[];
	editEvent?: boolean
}

export default function FilteredEventsList({ allEvents, activeTags, editEvent }: FilteredEventsListProps) {
	
	const filteredEvents = allEvents.filter(event => {
		// Only return events where at least one of the active tags is present
		return activeTags.some(tag => (event.event_type & tag) === tag);
	});

	const monthYearGroupings = convertEventsToMonthYearGroupings(filteredEvents);
	const sortedMonthYearKeys = Object.keys(monthYearGroupings).sort((a, b) => {
		const [monthA, yearA] = a.split('/');
		const [monthB, yearB] = b.split('/');
		const dateA = new Date(`${yearA}-${monthA}-01`);
		const dateB = new Date(`${yearB}-${monthB}-01`);
		return dateA.getTime() - dateB.getTime();
	});

	return (
		<div>
			{sortedMonthYearKeys.map((monthYearKey, index) => {
				const [month, year] = monthYearKey.split('/');
				return (
					<EventSection key={index} month={month} year={year} events={monthYearGroupings[monthYearKey]} editEvent={editEvent} />
				);
			})}
		</div>
	);
}
