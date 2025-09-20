"use server";

import ModernCreateEvent from "@/app/components/events-page/modern-create-event";
import { SocietyLogos } from "@/app/lib/utils";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { User } from "next-auth";
import { checkOwnershipOfEvent, fetchEventById } from "@/app/lib/data";

interface EditPageProps {
    searchParams: { id?: string };
}

export default async function EditPage({ searchParams }: EditPageProps) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const eventId = searchParams.id;
    if (!eventId) {
        notFound();
    }

    const user = session?.user;
    const user_id = user.id;

    // Check ownership of the event
    try {
        const isOwner = await checkOwnershipOfEvent(user_id, eventId);
        if (!isOwner) {
            // User doesn't own this event - redirect to unauthorized or events page
            redirect("/events?error=unauthorized");
        }
    } catch (error) {
        console.error("Error checking event ownership:", error);
        notFound();
    }

    // Fetch the event data for editing
    let existingEvent;
    try {
        existingEvent = await fetchEventById(eventId);
        if (!existingEvent) {
            notFound();
        }
    } catch (error) {
        console.error("Error fetching event:", error);
        notFound();
    }

    const organiserList = await getAuthorisedOrganiserList(user);

    return (
        <ModernCreateEvent
            organiser_id={user_id}
            organiserList={organiserList}
            editMode={true}
            existingEvent={existingEvent}
        />
    );
}

// Returns the list of Organisers a user is allowed to post for
async function getAuthorisedOrganiserList(user: User): Promise<string[]> {
    try {
        if (user?.role === "admin") {
            return SocietyLogos.map((society) => society.name);
        }
        if (user?.name) {
            return [user?.name];
        } else {
            throw new Error("User is not authenticated");
        }
    } catch (error) {
        console.error("Failed to get authorised organiser list:", error);
        return [];
    }
}
