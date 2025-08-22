import { fetchAllUpcomingEvents, getRegistrationsForEvent } from "@/app/lib/data";
import { Event } from "@/app/lib/types";

// Normalize both dates to UTC for comparison
const parseEventDateInUTC = (dateStr: string): Date => {
  const [day, month, year] = dateStr.split('/').map((part) => parseInt(part, 10));
  // Create the date in UTC, set the time to midnight UTC
  return new Date(Date.UTC(year, month - 1, day));
};

// Get tomorrow in UTC
const getTomorrowInUTC = (): Date => {
  const currentDate = new Date();
  const tomorrow = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate() + 1));
  tomorrow.setUTCHours(0, 0, 0, 0); // Set to midnight in UTC
  return tomorrow;
};


// after writeing this with post, seems there is no need for this to be a POST request, as we are not sending any data to the server.
// consider making a endpoint for a individual event and use it here.
// the request should not contain any data, this is just a notification endpoint for github cron job
export async function GET() {
  // get the event if of all the events in the future.
  const allEvents: Event[] = await fetchAllUpcomingEvents()
  const today = new Date() // get today's date
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  // console.log("allEvents", allEvents);
  for (const event of allEvents) {
    // if the event happens just tomorrow, we notify all the users
    if (
      parseEventDateInUTC(event.date).getUTCFullYear() === getTomorrowInUTC().getUTCFullYear() &&
      parseEventDateInUTC(event.date).getUTCMonth() === getTomorrowInUTC().getUTCMonth() &&
      parseEventDateInUTC(event.date).getUTCDate() === getTomorrowInUTC().getUTCDate()
    ) {
      // fetch all the registrations for the event
      const registrations = await getRegistrationsForEvent(event.id)
      console.log("registrations", registrations);
      for (const registration of registrations.registrations) {
        // send an email to each user
        // dev: only send to hongleigu19@gmail.com, dont want to disturb other users
        console.log("registration", registration);
        if (registration.user_email !== 'hongleigu19@gmail.com') continue;
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/email/send-user-notice`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fromEmail: 'hello@londonstudentnetwork.com',
              toEmail: registration.user_email,
              subject: `Reminder: ${event.title} is happening tomorrow!`,
              text: `Hello ${registration.user_name},\n\nThis is a reminder that the event "${event.title}" is happening tomorrow at ${event.time}.\n\nBest regards,\nLondon Student Network`,
            }),
          });
        } catch (error) {
          console.error('Error sending email:', error);
          return new Response('Failed to send notifications', { status: 500 }); 
        }
      }
    }
  }
  return new Response('Notifications sent', { status: 200 });
}