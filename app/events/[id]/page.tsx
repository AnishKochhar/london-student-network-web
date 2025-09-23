import EventInfo from "./event-info";
import { EventStructuredData } from "@/app/components/seo/structured-data";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import type { Metadata } from "next";

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getEventData(eventId: string) {
    try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events/get-information`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: eventId }),
            cache: 'no-store', // Ensure fresh data for metadata
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching event data for metadata:', error);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const eventId = base62ToBase16(id);
    const event = await getEventData(eventId);

    if (!event) {
        return {
            title: 'Event Not Found | London Student Network',
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
            title: `${event.title} | London Student Network`,
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
    const event = await getEventData(eventId);

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
