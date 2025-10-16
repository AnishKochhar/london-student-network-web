import { Queue } from 'bullmq'
import getRedisClient from './redis'

const connection = await getRedisClient();

export const reminderQueue = new Queue("event-email-reminders", {
    connection,
});
