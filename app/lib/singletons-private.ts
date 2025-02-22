'get server'


// All exports are centralized here for easy imports in other files.
// Functions are defined in individual config files for maintainability.

import getRedisClient from "./config/private/redis";
import getSendGridClient from "./config/private/sendgrid";
import getSecretStripe from "./config/private/stripe-secret";

export async function getSecretStripePromise() {
    return getSecretStripe();
}


export function getSendGridClientInstance() {
    return getSendGridClient();
}


export async function getRedisClientInstance() {
    return getRedisClient();
}
