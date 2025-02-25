'use server'


import { DefaultEmailPayloadType } from '../../types/emails';

import sgMail from '@sendgrid/mail';

// ================================
// sendgrid initialization
// ================================

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
    console.error('SendGrid API key is missing!');
    throw new Error('SENDGRID_API_KEY environment variable not set');
}

sgMail.setApiKey(SENDGRID_API_KEY); // sgMail setup is light and will likely not be required repeatedly, so just re-attach always

// Function to send an email (exported as a server action)
export default async function sendSendGridEmail({ to, from='hello@londonstudentnetwork.com', subject, text, html }: DefaultEmailPayloadType) {
    if (!text && !html) {
        throw new Error("At least one of 'text' or 'html' must be provided.");
      }
    
    //   const content = [];
    //   if (text) content.push({ type: 'text/plain', value: text });
    //   if (html) content.push({ type: 'text/html', value: html });
    
      const msg = {
        to,
        from,
        subject,
        ...(text && { text }),
        ...(html && { html }),
        // content,
      };
    
      await sgMail.send(msg);
      return { success: true };
    // on failure, an error is raised that should be catched wherever this function is used
}
