import ModernEventInfo from "./modern-event-info";
import { EventStructuredData } from "@/app/components/seo/structured-data";
import { base62ToBase16 } from "@/app/lib/uuid-utils";
import { fetchEventById } from "@/app/lib/data";
import { auth } from "@/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { LiquidButton } from "@/app/components/ui/liquid-button";
import EventAnalyticsTracker from "@/app/components/analytics/event-analytics-tracker";

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
    const session = await auth();

    // Check if event exists
    if (!event) {
        return (
            <main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#f8f9fa] via-[#e9ecef] to-[#feffff]">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-xl mx-auto">
                    <div className="text-6xl mb-6">🔍</div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Not Found</h1>
                    <p className="text-lg text-gray-600 mb-10">
                        Sorry, we couldn&apos;t find the event you&apos;re looking for.
                    </p>
                    <Link
                        href="/events"
                        className="px-8 py-3 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-gray-700 hover:text-gray-900 transition-all duration-300 backdrop-blur-sm border border-blue-400/20"
                    >
                        ← Browse All Events
                    </Link>
                </div>
            </main>
        );
    }

    // Check visibility permissions
    const visibilityLevel = event.visibility_level || 'public';
    const userVerifiedUniversity = session?.user?.verified_university;
    const isLoggedIn = !!session?.user;

    let hasAccess = false;

    if (visibilityLevel === 'public' || !visibilityLevel) {
        hasAccess = true;
    } else if (visibilityLevel === 'private') {
        // Private events are accessible to anyone with the direct link
        hasAccess = true;
    } else if (visibilityLevel === 'students_only') {
        hasAccess = isLoggedIn;
    } else if (visibilityLevel === 'verified_students') {
        hasAccess = !!userVerifiedUniversity;
    } else if (visibilityLevel === 'university_exclusive') {
        const allowedUniversities = event.allowed_universities || [];
        hasAccess = !!userVerifiedUniversity && allowedUniversities.includes(userVerifiedUniversity);
    }

    // Show access denied message if user doesn't have permission
    if (!hasAccess) {
        return (
			<main className="relative flex flex-col min-h-screen mx-auto p-8 pt-16 bg-gradient-to-b from-[#041A2E] via-[#064580] to-[#083157]">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-xl mx-auto">
                    <div className="text-6xl mb-6">🔒</div>
                    <h1 className="text-4xl font-bold text-gray-100 mb-4">Access Restricted</h1>
                    <p className="text-lg text-gray-300 mb-10">
                        This event is only visible to registered users. Please sign in to view event details.
                    </p>

                    <Link href="/sign">
                        <LiquidButton
                            size="lg"
                            className="  text-gray-100 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] backdrop-blur-md border border-white/20"
                        >
                            Sign In or Register
                        </LiquidButton>
                    </Link>

                    <Link
                        href="/events"
                        className="mt-6 px-8 py-3 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-gray-100  transition-all duration-300 backdrop-blur-sm border border-blue-400/20"
                    >
                        ← Back to Events
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="relative flex flex-col min-h-screen mx-auto pt-16 bg-white">
            {event && (
                <>
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
                    {/* Analytics Tracker - pass the actual event.id from database */}
                    <EventAnalyticsTracker
                        eventId={event.id}
                        eventTitle={event.title}
                    />
                </>
            )}
            <ModernEventInfo />
        </main>
    );
}
