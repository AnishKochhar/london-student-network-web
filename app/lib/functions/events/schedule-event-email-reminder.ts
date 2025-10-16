import { reminderQueue } from "../../config/private/bullmq-queue";

export async function scheduleEventEmailReminder({
    user_id,
    event_id,
    attempts = 0,
    buffer_time,
    guest_email,
    guest_name,
}: {
    user_id: string | null;
    event_id: string;
    attempts: number;
    buffer_time: number; // in seconds
    guest_email?: string; // For guest registrations
    guest_name?: string; // For guest registrations
}) {
    // Create unique job ID to prevent duplicates
    // For guests, use email as part of ID since user_id is null
    const jobId = user_id
        ? `reminder-${user_id}-${event_id}`
        : `reminder-guest-${guest_email}-${event_id}`;

    // Check if job already exists (prevents duplicate reminders)
    const existingJob = await reminderQueue.getJob(jobId);
    if (existingJob) {
        const state = await existingJob.getState();
        if (state === 'waiting' || state === 'delayed' || state === 'active') {
            console.log(`[SCHEDULE] Job ${jobId} already exists in state: ${state}, skipping`);
            return { skipped: true, reason: 'already_exists' };
        }
    }

    // Add job with unique ID
    await reminderQueue.add(
        "send_event_email_reminder",
        {
            user_id,
            event_id,
            attempts,
            guest_email,
            guest_name
        },
        {
            jobId,
            delay: buffer_time * 1000
        }
    );

    console.log(`[SCHEDULE] Created reminder job ${jobId} with ${buffer_time}s delay`);
    return { created: true };
}
