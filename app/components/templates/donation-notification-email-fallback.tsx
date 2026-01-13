export interface DonationNotificationDetails {
    society_name: string;
    donor_name?: string;
    donor_email: string;
    amount_pounds: string;
    fee_covered_pounds?: string;
    message?: string;
}

const DonationNotificationEmailFallbackPayload = (details: DonationNotificationDetails) => {
    const donorDisplay = details.donor_name || 'Anonymous';

    let text = `Great news!

${details.society_name} just received a donation!

DONATION RECEIVED
-----------------
Amount: £${details.amount_pounds}`;

    if (details.fee_covered_pounds) {
        text += `
Donor covered £${details.fee_covered_pounds} in transaction fees`;
    }

    text += `

DONOR DETAILS
-------------
Name: ${donorDisplay}
Email: ${details.donor_email}`;

    if (details.message) {
        text += `

MESSAGE FROM THE DONOR:
"${details.message}"`;
    }

    text += `

This donation will be transferred to your connected Stripe account. Funds typically arrive within 2-7 business days.

Consider sending a personal thank you to show your appreciation!

Cheers,
The LSN team

---
Questions? Contact us at hello@londonstudentnetwork.com`;

    return text;
};

export default DonationNotificationEmailFallbackPayload;
