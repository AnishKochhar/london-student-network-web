import { Event } from "../types";
import { Tickets } from "../types";

export interface DefaultEmailPayloadType {
    to: string;
    from?: string; // there is a default sender 'hello@londonstudentnetwork.com'
    subject: string;
    text?: string; // email might only contain html body
    html?: string; // email might only contain text body
}

export interface FallbackEmailServiceResponse {
    success: boolean;
    error?: string; // when there is an error
    info?: string; // when the response is succesfull, gives email transportation info
}

export interface UserEmailReminderInterface {
    email: string;
    user_name: string;
    event: Event;
    ticketDetails: Tickets[];
    ticket_to_quantity: Record<string, number>;
    organiser_uid: string
}

