import { fetchUpcomingEvents } from "@/app/lib/data";
import { sortEventsByDate } from "@/app/lib/utils";
import UpcomingEventsView from "./upcoming-events";
import { auth } from "@/auth";

export default async function UpcomingEventsSection() {
    const session = await auth();

    // Pass session to filter events based on visibility level
    const userSession = session?.user
        ? {
              id: session.user.id,
              verified_university: session.user.verified_university,
              role: session.user.role,
          }
        : null;

    const allEvents = await fetchUpcomingEvents(userSession);
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
