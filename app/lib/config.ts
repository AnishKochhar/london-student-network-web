import Redis from 'ioredis';
import sgMail from '@sendgrid/mail';

// ================================
// redis initialization
// ================================

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
throw new Error('REDIS_URL environment variable is not set');
}

// Initialize the Redis client
const redis = new Redis(REDIS_URL)

redis.on('connect', () => {
console.log('Connected to Redis successfully');
});

redis.on('error', (error) => {
console.error('Error connecting to Redis:', error);
});

// ================================
// sendgrid initialization
// ================================

if (!process.env.SENDGRID_API_KEY) {
	console.error('SendGrid API key is missing!');
	throw new Error('SENDGRID_API_KEY environment variable not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');


export { redis };
export { sgMail };
// export const BASE_URL = `https://${process.env.VERCEL_URL}` || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
export const BASE_URL =
	process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}`
		: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
