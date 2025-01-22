import Redis from 'ioredis';
import sgMail from '@sendgrid/mail';

// ================================
// redis initialization
// ================================

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
	throw new Error('REDIS_URL environment variable is not set');
}

// Initialize one redis instance
let redis: Redis;


// redis singleton
export function getRedisClient() {
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

// ================================
// sendgrid initialization
// ================================

if (!process.env.SENDGRID_API_KEY) {
	console.error('SendGrid API key is missing!');
	throw new Error('SENDGRID_API_KEY environment variable not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');


export { sgMail };
