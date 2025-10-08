import Redis from "ioredis";

// ================================
// redis initialization
// ================================

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    throw new Error("REDIS_URL environment variable is not set");
}

// Initialize the Redis client
const redis = new Redis(REDIS_URL);

redis.on("error", (error) => {
    console.error("Error connecting to Redis:", error);
});

export { redis };
export const BASE_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
