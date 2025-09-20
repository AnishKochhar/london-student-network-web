import { fetchAllUpcomingEvents } from "../lib/data";
import FilteredEventsPage from "../components/events-page/filtered-events-page";
import CreateEventButton from "../components/events-page/create-event-button";
import AnimatedTitle from "../components/events-page/animated-title";

export const revalidate = 60; // Once per minute

export default async function EventPage() {
    const allEvents = await fetchAllUpcomingEvents();

    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] ">
            <AnimatedTitle />

            <CreateEventButton />

            <FilteredEventsPage allEvents={allEvents} editEvent={false} />
        </main>
    );
}
