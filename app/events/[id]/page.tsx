import EventInfo from "./event-info";
import { EventStructuredData } from "@/app/components/seo/structured-data";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import { fetchEventById } from "@/app/lib/data";
import type { Metadata } from "next";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const eventId = base62ToBase16(id);
    const event = await fetchEventById(eventId);

    if (!event) {
        return {
            title: 'Event Not Found',
            description: 'The requested event could not be found.',
        };
    }

    const eventDate = new Date(event.start_datetime).toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return {
        title: `${event.title} - ${eventDate}`,
        description: event.description?.slice(0, 160) || `Join us for ${event.title} on ${eventDate}. Organized by ${event.organiser}.`,
        keywords: [
            event.title,
            event.organiser,
            'London student event',
            'university event',
            event.location_area,
            event.location_building
        ].filter(Boolean),
        openGraph: {
            title: event.title,
            description: event.description?.slice(0, 160) || `Join us for ${event.title} on ${eventDate}`,
            url: `https://londonstudentnetwork.com/events/${id}`,
            type: 'website',
            images: event.image_url ? [
                {
                    url: event.image_url,
                    width: 1200,
                    height: 630,
                    alt: `${event.title} event image`,
                }
            ] : [],
        },
        alternates: {
            canonical: `https://londonstudentnetwork.com/events/${id}`,
        },
    };
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    const eventId = base62ToBase16(id);
    const event = await fetchEventById(eventId);

    return (
        <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#f8f9fa] via-[#e9ecef] to-[#feffff]">
            {event && (
                <EventStructuredData
                    name={event.title}
                    description={event.description || ''}
                    startDate={event.start_datetime}
                    endDate={event.end_datetime}
                    location={{
                        name: `${event.location_building}, ${event.location_area}`,
                        address: event.location_address,
                    }}
                    organizer={{
                        name: event.organiser,
                        url: "https://londonstudentnetwork.com"
                    }}
                    url={`https://londonstudentnetwork.com/events/${id}`}
                    image={event.image_url}
                    offers={{
                        price: "0",
                        priceCurrency: "GBP",
                        availability: "https://schema.org/InStock"
                    }}
                />
            )}
            <EventInfo />
        </main>
    );
}
