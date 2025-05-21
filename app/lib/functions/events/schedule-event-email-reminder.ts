import { reminderQueue } from "../../config/private/bullmq-queue";

export async function scheduleEventEmailReminder({
    user_id,
    event_id,
    attempts = 0,
    buffer_time,
}: {
    user_id: string;
    event_id: string;
    attempts: number;
    buffer_time: number; // in seconds
}) {
    reminderQueue.add(
        "send_event_email_reminder",
        { user_id, event_id, attempts },
        { delay: buffer_time * 1000 }
    );
}
