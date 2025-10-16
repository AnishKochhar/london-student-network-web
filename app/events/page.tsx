import { fetchAllUpcomingEvents } from "../lib/data";
import FilteredEventsPage from "../components/events-page/filtered-events-page";
import CreateEventButton from "../components/events-page/create-event-button";
import AnimatedTitle from "../components/events-page/animated-title";
import { auth } from "@/auth";
import type { Metadata } from "next";

export const revalidate = 60; // Once per minute

export const metadata: Metadata = {
    title: "Student Events in London",
    description: "Discover amazing student events across London's universities. From academic workshops to social gatherings, networking events to career fairs - find your next opportunity.",
    keywords: [
        "London student events",
        "university events London",
        "student activities",
        "student networking",
        "London university calendar",
        "student workshops",
        "career events",
        "social events students"
    ],
    openGraph: {
        title: "Student Events in London | London Student Network",
        description: "Discover amazing student events across London's universities. From academic workshops to social gatherings, networking events to career fairs.",
        url: "https://londonstudentnetwork.com/events",
        images: [
            {
                url: "/og-events.jpg",
                width: 1200,
                height: 630,
                alt: "London Student Events - Discover Your Next Opportunity",
            }
        ],
    },
    alternates: {
        canonical: "https://londonstudentnetwork.com/events",
    },
};

export default async function EventPage() {
    const session = await auth();

    // Pass session to filter events based on visibility level
    const userSession = session?.user
        ? {
              id: session.user.id,
              verified_university: session.user.verified_university,
              role: session.user.role,
          }
        : null;

    const allEvents = await fetchAllUpcomingEvents(userSession);

    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] ">
            <AnimatedTitle />

            <CreateEventButton />

            <FilteredEventsPage allEvents={allEvents} editEvent={false} />
        </main>
    );
}
