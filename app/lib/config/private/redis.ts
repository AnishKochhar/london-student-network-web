'use server'

import Redis from 'ioredis';

// ================================
// redis initialization
// ================================

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
	throw new Error('REDIS_URL environment variable is not set');
}

// Initialize one redis instance
let redis: Redis | null = null;

// redis singleton
export default async function getRedisClient() {
    if (!redis) {
        redis = new Redis(REDIS_URL);
        redis.on('connect', () => {
            console.log('Connected to Redis successfully');
        });

        redis.on('error', (error) => {
            console.error('Error connecting to Redis:', error);
        });
    }
    return redis;
}
