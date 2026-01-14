import { fetchPaginatedUpcomingEvents } from "../lib/data";
import FilteredEventsPage from "../components/events-page/filtered-events-page";
import CreateEventButton from "../components/events-page/create-event-button";
import AnimatedTitle from "../components/events-page/animated-title";
import { auth } from "@/auth";
import { Suspense } from "react";
import type { Metadata } from "next";

export const revalidate = 300; // Every 5 minutes - balances freshness with performance

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

    // Fetch initial paginated events (30 items for first load)
    const { events: initialEvents, total } = await fetchPaginatedUpcomingEvents(userSession, 30, 0);

    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157] ">
            <AnimatedTitle />

            <CreateEventButton />

            <Suspense fallback={<div className="text-white text-center py-8">Loading events...</div>}>
                <FilteredEventsPage
                    allEvents={initialEvents}
                    initialTotal={total}
                    editEvent={false}
                />
            </Suspense>
        </main>
    );
}
