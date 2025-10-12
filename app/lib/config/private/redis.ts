'use server'

import Redis from 'ioredis';

// ================================
// redis initialization
// ================================


const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set');
}


// Use a global variable to persist across module reloads (due to ephemeral nature of serverless functions)
declare global {
    // eslint-disable-next-line no-var
    var _redis: Redis | undefined;
}

export default async function getRedisClient(): Promise<Redis> {
    if (!global._redis) {
        global._redis = new Redis(REDIS_URL);
        global._redis.on('connect', () => {
            console.log(`->->->->->->(developer message) Attempted at: [${new Date().toISOString()}] Connected to Redis successfully<-<-<-<-<-<-`);
        });

        global._redis.on('error', (error) => {
            console.error(`->->->->->->(developer message) Attempted at: [${new Date().toISOString()}]`, 'Error connecting to Redis:<-<-<-<-<-<-', error,);
        });
    }
    return global._redis;
}
