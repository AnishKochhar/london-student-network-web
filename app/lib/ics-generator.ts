import { Event } from "./types";
import { formatInTimeZone } from "date-fns-tz";

/**
 * Formats a date for ICS file format in London timezone (YYYYMMDDTHHMMSS)
 * Note: No 'Z' suffix when using TZID
 */
function formatICSDateWithTZ(date: Date): string {
    // Format in London timezone without the Z suffix
    // We'll use TZID parameter to indicate the timezone
    const formatted = formatInTimeZone(date, 'Europe/London', "yyyyMMdd'T'HHmmss");
    return formatted;
}

/**
 * Formats a date for ICS file format in UTC (YYYYMMDDTHHMMSSZ)
 * Used for DTSTAMP
 */
function formatICSDateUTC(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Escapes special characters for ICS format
 */
function escapeICSText(text: string): string {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}

/**
 * Generates a unique identifier for the event
 */
function generateUID(eventId: string): string {
    return `${eventId}@londonstudentnetwork.com`;
}

/**
 * Generates an ICS file content for an event with London timezone
 */
export function generateICSFile(event: Event, userEmail?: string): string {
    const now = new Date();
    const startDate = event.start_datetime ? new Date(event.start_datetime) : null;
    const endDate = event.end_datetime ? new Date(event.end_datetime) : null;

    if (!startDate || !endDate) {
        throw new Error('Event must have start and end datetime for ICS generation');
    }

    const location = [
        event.location_building,
        event.location_area,
        event.location_address
    ].filter(Boolean).join(', ');

    const description = escapeICSText(
        event.description || 'Event hosted by London Student Network'
    );

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//London Student Network//Events//EN',
        'METHOD:REQUEST',
        'CALSCALE:GREGORIAN',
        // VTIMEZONE component for Europe/London
        'BEGIN:VTIMEZONE',
        'TZID:Europe/London',
        'BEGIN:DAYLIGHT',
        'TZOFFSETFROM:+0000',
        'TZOFFSETTO:+0100',
        'TZNAME:BST',
        'DTSTART:19700329T010000',
        'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
        'END:DAYLIGHT',
        'BEGIN:STANDARD',
        'TZOFFSETFROM:+0100',
        'TZOFFSETTO:+0000',
        'TZNAME:GMT',
        'DTSTART:19701025T020000',
        'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
        'END:STANDARD',
        'END:VTIMEZONE',
        // Event details
        'BEGIN:VEVENT',
        `UID:${generateUID(event.id)}`,
        `DTSTAMP:${formatICSDateUTC(now)}`,
        `DTSTART;TZID=Europe/London:${formatICSDateWithTZ(startDate)}`,
        `DTEND;TZID=Europe/London:${formatICSDateWithTZ(endDate)}`,
        `SUMMARY:${escapeICSText(event.title)}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${escapeICSText(location)}`,
        'ORGANIZER;CN=London Student Network:mailto:hello@londonstudentnetwork.com',
        userEmail ? `ATTENDEE;CN=${userEmail};RSVP=TRUE:mailto:${userEmail}` : '',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'TRANSP:OPAQUE',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder: Event starts in 1 hour',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ]
        .filter(line => line !== '') // Remove empty lines
        .join('\r\n');

    return icsContent;
}

/**
 * Generates calendar URLs for different providers
 */
export function generateCalendarURLs(event: Event) {
    const startDate = event.start_datetime ? new Date(event.start_datetime) : null;
    const endDate = event.end_datetime ? new Date(event.end_datetime) : null;

    if (!startDate || !endDate) {
        return null;
    }

    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(
        [event.location_building, event.location_area]
            .filter(Boolean)
            .join(', ')
    );

    // Format for Google Calendar: YYYYMMDDTHHMMSS in London timezone
    // Google Calendar accepts local time format and uses ctz parameter for timezone
    const LONDON_TZ = 'Europe/London';
    const googleStart = formatInTimeZone(startDate, LONDON_TZ, "yyyyMMdd'T'HHmmss");
    const googleEnd = formatInTimeZone(endDate, LONDON_TZ, "yyyyMMdd'T'HHmmss");

    // Format for Outlook: ISO 8601
    const outlookStart = startDate.toISOString();
    const outlookEnd = endDate.toISOString();

    return {
        google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${googleStart}/${googleEnd}&details=${description}&location=${location}&ctz=${LONDON_TZ}`,
        outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${description}&location=${location}`,
        outlookOffice365: `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${description}&location=${location}`,
        yahoo: `https://calendar.yahoo.com/?v=60&title=${title}&st=${googleStart}&et=${googleEnd}&desc=${description}&in_loc=${location}`,
        // Apple Calendar uses ICS files
        apple: null // Will download ICS file
    };
}

/**
 * Creates a downloadable ICS file blob
 */
export function createICSBlob(icsContent: string): Blob {
    return new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
}

/**
 * Triggers download of ICS file in browser
 */
export function downloadICSFile(event: Event, userEmail?: string) {
    const icsContent = generateICSFile(event, userEmail);
    const blob = createICSBlob(icsContent);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
