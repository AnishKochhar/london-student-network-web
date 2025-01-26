'use client'


// All exports are centralized here for easy imports in other files.
// Functions are defined in individual config files for maintainability.

import getPublicStripe from "./config/public/stripe-public";
import getStripeConnectPromise from "./config/public/stripe-connect";
import getCurrentStripeConnectPromise from "./config/public/current-stripe-connect";

export async function getPublicStripePromise() {
    return getPublicStripe();
}


export async function getPublicStripeConnectPromise(userId: string) {
    return getStripeConnectPromise(userId);
}

export async function getCurrentPublicStripeConnectPromise(userId: string) {
    return getCurrentPublicStripeConnectPromise(userId);
}
