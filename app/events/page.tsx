import { fetchAllUpcomingEvents } from '../lib/data';
import FilteredEventsPage from '../components/events-page/filtered-events-page';
import CreateEventButton from '../components/events-page/create-event-button';

export const revalidate = 60 // Once per minute

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upcoming Student Events in London | London Student Network",
  description: "View popular upcoming events, hosted by students like you.",
};

export default async function EventPage() {

	const allEvents = await fetchAllUpcomingEvents()

	return (
		<main className='relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] '>
			<h1 className="text-4xl font-bold mb-8 text-center">Upcoming Events</h1>
			
			<CreateEventButton />

			<FilteredEventsPage allEvents={allEvents} editEvent={false} />

		</main>
	)
}