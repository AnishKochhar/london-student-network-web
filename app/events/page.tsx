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
	const fakeEvent = {
		id: "aaaa-bbbbb-cccc-0909",
		title: "Sample Student Event",
		description: "This is a sample event for demonstration purposes. Join us for a fun and engaging experience!",
		date: "15/09/2025", // DD/MM/YYYY
		time: "18:00",
		location: "123 Example Venue, London",
		organiser: "London Student Network",
		organiser_logo: "",
		image_url: "/images/placeholders/social.jpg",
		tickets_info: [
			{
				ticket_uuid: "ticket-1",
				ticketName: "General Admission",
				price: 0,
				capacity: 100,
				available: 100,
			}
		],
		tickets_price: "0",
		event_type: 1,
		for_externals: "",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
	allEvents.push(fakeEvent);

	return (
		<main className='relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] '>
			<h1 className="text-4xl font-bold mb-8 text-center">Upcoming Events</h1>
			
			<CreateEventButton />

			<FilteredEventsPage allEvents={allEvents} editEvent={false} />

		</main>
	)
}