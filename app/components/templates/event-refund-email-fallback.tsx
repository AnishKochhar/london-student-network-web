import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";

export interface RefundInfo {
    refund_amount: string;
    is_full_refund: boolean;
    original_amount: string;
    reason?: string;
}

const EventRefundEmailFallbackPayload = (
    userName: string,
    event: Event,
    refundInfo: RefundInfo
) => {
    const LONDON_TZ = 'Europe/London';

    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
        : event.date;

    const eventTime = event.start_datetime && event.end_datetime
        ? `${formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'HH:mm')} - ${formatInTimeZone(new Date(event.end_datetime), LONDON_TZ, 'HH:mm')}`
        : event.time;

    return `
Hey ${userName},

We're writing to confirm that your ${refundInfo.is_full_refund ? 'refund' : 'partial refund'} for ${event.title} has been processed.

REFUND DETAILS
--------------
Refund Amount: £${refundInfo.refund_amount}
${!refundInfo.is_full_refund ? `Original Amount: £${refundInfo.original_amount}\n` : ''}Status: ${refundInfo.is_full_refund ? 'Full Refund' : 'Partial Refund'}
${refundInfo.reason ? `Reason: ${refundInfo.reason}\n` : ''}

WHEN WILL I RECEIVE MY REFUND?
-------------------------------
Refunds typically appear in your account within 5-10 business days, depending on your bank or card provider. The refund will be credited to the original payment method used.

EVENT DETAILS
-------------
Event: ${event.title}
Date: ${eventDate}
Time: ${eventTime}
Location: ${event.location_building}, ${event.location_area}

${refundInfo.is_full_refund
    ? "Your registration has been cancelled and you will no longer receive updates about this event. We're sorry you can't make it!"
    : "Your registration remains active. We look forward to seeing you at the event!"}

If you have any questions about this refund or need assistance, please don't hesitate to reach out by replying to this email.

Best regards,
The LSN team

---
Questions? Contact us at hello@londonstudentnetwork.com
    `.trim();
};

export default EventRefundEmailFallbackPayload;
