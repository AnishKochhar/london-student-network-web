import { Queue } from 'bullmq'
import { getRedisClientInstance } from '../../singletons-private'

const connection = await getRedisClientInstance();

export const reminderQueue = new Queue("event-email-reminders", {
    connection,
});
