import { reminderQueue } from "../../config/private/bullmq-queue";

export async function scheduleOrganizerSummaryEmail({
    event_id,
    buffer_time,
}: {
    event_id: string;
    buffer_time: number; // in seconds
}) {
    // Create unique job ID to prevent duplicates
    const jobId = `organizer-summary-${event_id}`;

    // Check if job already exists
    const existingJob = await reminderQueue.getJob(jobId);
    if (existingJob) {
        const state = await existingJob.getState();
        if (state === 'waiting' || state === 'delayed' || state === 'active') {
            console.log(`[SCHEDULE] Organizer summary job ${jobId} already exists in state: ${state}, skipping`);
            return { skipped: true, reason: 'already_exists' };
        }
    }

    // Add job with unique ID
    await reminderQueue.add(
        "send_organizer_summary",
        { event_id },
        {
            jobId,
            delay: buffer_time * 1000
        }
    );

    console.log(`[SCHEDULE] Created organizer summary job ${jobId} with ${buffer_time}s delay`);
    return { created: true };
}
