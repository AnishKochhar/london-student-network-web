import { Event } from "@/app/lib/types";
import { formatInTimeZone } from "date-fns-tz";

export interface RefundInfo {
    refund_amount: string;
    is_full_refund: boolean;
    original_amount: string;
    reason?: string;
}

const EventRefundEmailPayload = (
    userName: string,
    event: Event,
    refundInfo: RefundInfo
) => {
    const LONDON_TZ = 'Europe/London';

    // Use date-fns-tz for reliable timezone conversion in Node.js
    const eventDate = event.start_datetime
        ? formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'EEEE, d MMMM yyyy')
        : event.date;

    const eventTime = event.start_datetime && event.end_datetime
        ? `${formatInTimeZone(new Date(event.start_datetime), LONDON_TZ, 'HH:mm')} - ${formatInTimeZone(new Date(event.end_datetime), LONDON_TZ, 'HH:mm')}`
        : event.time;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>Hey ${userName},</p>

            <p>We're writing to confirm that your ${refundInfo.is_full_refund ? 'refund' : 'partial refund'} for <strong>${event.title}</strong> has been processed.</p>

            <div style="background: #f0f9ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0 0 15px 0;"><strong>💰 Refund Details:</strong></p>
                <p style="margin: 8px 0; font-size: 15px;">
                    <strong>Refund Amount:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">£${refundInfo.refund_amount}</span>
                </p>
                ${!refundInfo.is_full_refund ? `
                <p style="margin: 8px 0; font-size: 14px; color: #666;">
                    Original Amount: £${refundInfo.original_amount}
                </p>
                ` : ''}
                <p style="margin: 8px 0; font-size: 14px; color: #666;">
                    Status: ${refundInfo.is_full_refund ? 'Full Refund' : 'Partial Refund'}
                </p>
                ${refundInfo.reason ? `
                <p style="margin: 8px 0; font-size: 14px; color: #666;">
                    Reason: ${refundInfo.reason}
                </p>
                ` : ''}
            </div>

            <div style="background: #fffbeb; padding: 20px; border-left: 4px solid #f59e0b; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>⏱️ When will I receive my refund?</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                    Refunds typically appear in your account within <strong>5-10 business days</strong>, depending on your bank or card provider. The refund will be credited to the original payment method used.
                </p>
            </div>

            <div style="background: #f9f9f9; padding: 15px; border-left: 3px solid #6b7280; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; font-size: 14px;"><strong>📅 Event Details:</strong></p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">
                    <strong>Event:</strong> ${event.title}<br>
                    <strong>Date:</strong> ${eventDate}<br>
                    <strong>Time:</strong> ${eventTime}<br>
                    <strong>Location:</strong> ${event.location_building}, ${event.location_area}
                </p>
            </div>

            ${refundInfo.is_full_refund ? `
            <p>Your registration has been cancelled and you will no longer receive updates about this event. We're sorry you can't make it!</p>
            ` : `
            <p>Your registration remains active. We look forward to seeing you at the event!</p>
            `}

            <p>If you have any questions about this refund or need assistance, please don't hesitate to reach out by replying to this email.</p>

            <p>Best regards,</p>
            <p style="margin-left: 20px;">The LSN team</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions? Contact us at <a href="mailto:hello@londonstudentnetwork.com" style="color: #3b82f6; text-decoration: none;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default EventRefundEmailPayload;
