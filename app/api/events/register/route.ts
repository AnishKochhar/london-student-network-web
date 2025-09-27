import { NextResponse } from "next/server";
import {
    checkIfRegistered,
    fetchSQLEventById,
    getUserUniversityById,
    registerForEvent,
    getEventOrganiserEmail,
} from "@/app/lib/data";
import { sendEventRegistrationEmail } from "@/app/lib/send-email";
import EventRegistrationEmailPayload from "@/app/components/templates/event-registration-email";
import EventRegistrationEmailFallbackPayload from "@/app/components/templates/event-registration-email-fallback";
import EventOrganizerNotificationEmailPayload from "@/app/components/templates/event-organizer-notification-email";
import EventOrganizerNotificationEmailFallbackPayload from "@/app/components/templates/event-organizer-notification-email-fallback";
import { convertSQLEventToEvent } from "@/app/lib/utils";

export async function POST(req: Request) {
    const { event_id, user_information } = await req.json();
    const user: { email: string; id: string; name: string } = user_information;

    // step1: find the user
    const userUniversity = await getUserUniversityById(user.id);
    if (!userUniversity.success) {
        return NextResponse.json({
            success: false,
            error: userUniversity.error,
        });
    }

    const event = await fetchSQLEventById(event_id);
    if (!event) {
        return NextResponse.json({
            success: false,
            error: "Event not found",
        });
    }

    // Check if event has ended
    const now = new Date();
    let eventEndTime: Date;

    if (event.end_datetime) {
        eventEndTime = new Date(event.end_datetime);
    } else {
        // Fallback to constructed datetime if end_datetime is null
        const eventDate = new Date(event.year, event.month - 1, event.day);
        const endTimeString = event.end_time || event.start_time; // Use end_time or fallback to start_time
        const [hours, minutes] = endTimeString.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
        eventEndTime = eventDate;
    }

    if (now > eventEndTime) {
        return NextResponse.json({
            success: false,
            error: "This event has already ended. Registration is no longer available.",
        });
    }

    const eventOrganiser = event.organiser_uid;
    const eventOrganiserUniversity = await getUserUniversityById(eventOrganiser);
    if (!eventOrganiserUniversity.success) {
        return NextResponse.json({
            success: false,
            error: eventOrganiserUniversity.error,
        });
    }

    const alreadyRegistered = await checkIfRegistered(event_id, user.id);
    if (alreadyRegistered) {
        return NextResponse.json({ success: false, registered: true });
    }

    console.log("Universities", userUniversity, eventOrganiserUniversity);
    const isExternal = userUniversity.university != eventOrganiserUniversity.university;

    const response = await registerForEvent(
        user.id,
        user.email,
        user.name,
        event_id,
        isExternal,
    );

    if (response.success) {
        // Convert SQL event to Event type for email templates
        const eventData = convertSQLEventToEvent(event);

        // Send confirmation email to registered user
        try {
            const emailSubject = `🎉 Registration Confirmed: ${event.title}`;
            const emailHtml = EventRegistrationEmailPayload(user.name, eventData);
            const emailText = EventRegistrationEmailFallbackPayload(user.name, eventData);

            await sendEventRegistrationEmail({
                toEmail: user.email,
                subject: emailSubject,
                html: emailHtml,
                text: emailText,
            });
        } catch (emailError) {
            console.error("Failed to send registration confirmation email:", emailError);
            // Don't fail the registration if email sending fails
        }

        // Send notification to organizer if not admin and notifications are enabled
        const ADMIN_ID = "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
        if (event.organiser_uid !== ADMIN_ID && event.send_signup_notifications !== false) {
            try {
                const organiserEmail = await getEventOrganiserEmail(event.organiser_uid);
                if (organiserEmail && organiserEmail.email) {
                    const orgEmailSubject = `🔔 New Registration: ${event.title}`;
                    const orgEmailHtml = EventOrganizerNotificationEmailPayload(
                        eventData,
                        {
                            name: user.name,
                            email: user.email,
                            external: isExternal
                        }
                    );
                    const orgEmailText = EventOrganizerNotificationEmailFallbackPayload(
                        eventData,
                        {
                            name: user.name,
                            email: user.email,
                            external: isExternal
                        }
                    );

                    await sendEventRegistrationEmail({
                        toEmail: organiserEmail.email,
                        subject: orgEmailSubject,
                        html: orgEmailHtml,
                        text: orgEmailText,
                    });
                }
            } catch (organiserEmailError) {
                console.error("Failed to send notification email to organiser:", organiserEmailError);
                // Don't fail the registration if organiser email fails
            }
        }
    }

    return NextResponse.json(response);
}
