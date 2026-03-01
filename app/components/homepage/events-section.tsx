import { fetchUpcomingEvents } from "@/app/lib/data";
import { sortEventsByDate } from "@/app/lib/utils";
import UpcomingEventsView from "./upcoming-events";

export default async function UpcomingEventsSection() {
    // Homepage shows public events only - treat all users as non-logged-in
    const allEvents = await fetchUpcomingEvents(null);
    const sortedEvents = sortEventsByDate(allEvents);

    return (
        <section className="flex flex-col items-center justify-center min-h-screen snap-start p-10">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-12 text-center">
                Upcoming Events
            </h2>
            <UpcomingEventsView events={sortedEvents} />
        </section>
    );
}
