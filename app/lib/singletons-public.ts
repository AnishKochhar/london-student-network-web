'use client'


// All exports are centralized here for easy imports in other files.
// Functions are defined in individual config files for maintainability.

import getPublicStripe from "./config/public/stripe-public";
import getStripeConnectPromise from "./config/public/stripe-connect";
import getCurrentStripeConnectPromise from "./config/public/current-stripe-connect";
import getPromiseForStandardDashboard from "./config/public/stripe-connect-standard-dashboard";

export async function getPublicStripePromise() {
    return getPublicStripe();
}


export async function getPublicStripeConnectPromise(userId: string) { // for new stripe connected account onboarding
    return getStripeConnectPromise(userId);
}

export async function getCurrentPublicStripeConnectPromise(userId: string) { // to resume stripe connected onboarding
    return getCurrentStripeConnectPromise(userId);
}

export async function getStripeConnectPromiseForStandardDashboard(userId: string) {
    return getPromiseForStandardDashboard(userId);
}
