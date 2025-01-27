'use server'


import sgMail from '@sendgrid/mail';

// ================================
// sendgrid initialization
// ================================

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is missing!');
    throw new Error('SENDGRID_API_KEY environment variable not set');
}

let isInitialized = false;

export default function getSendGridClient() {
    if (!isInitialized) {
        sgMail.setApiKey(SENDGRID_API_KEY);
        isInitialized = true;
    }
    return sgMail;
}
