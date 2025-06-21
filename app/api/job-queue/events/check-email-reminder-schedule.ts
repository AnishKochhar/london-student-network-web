import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { Worker } from "bullmq";
import { getRedisClientInstance } from "@/app/lib/singletons-private";
import { scheduleEventEmailReminder } from "@/app/lib/functions/events/schedule-event-email-reminder";
import { sendUserReminderEmail } from "@/app/lib/send-email";


const connection = await getRedisClientInstance();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const worker = new Worker(
        "event-email-reminders",
        async (job) => {
            const { user_id, event_id, attempts } = job.data;
            if (attempts > 3) {
                return;
            }
            await sendUserReminderEmail()

            console.log(`Triggering reminder email for ${user_id} on event ${event_id}`);
        },
        { connection }
    );

    worker.on("completed", (job) => {
        console.log(`Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        if (job.data.attempts > 3) {
            return;
        }
        scheduleEventEmailReminder(
            {   
                user_id: job.data.user_id,
                event_id: job.data.event_id,
                attempts: job.data.attempts + 1,
                buffer_time: 60 * 60 * (job.data.attempts + 1) // try again later in seconds
            }
        )
        console.error(`Job ${job?.id} failed:`, err);
    });

    return NextResponse.json({ message: "event-email-reminders queue being processed" }, { status: 200 });
}
