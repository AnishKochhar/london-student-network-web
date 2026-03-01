export interface DonationDetails {
    society_name: string;
    donor_name?: string;
    amount_pounds: string;
    fee_covered_pounds?: string;
    message?: string;
}

const DonationThankYouEmailFallbackPayload = (details: DonationDetails) => {
    const displayName = details.donor_name || 'there';
    const totalPaid = details.fee_covered_pounds
        ? (parseFloat(details.amount_pounds) + parseFloat(details.fee_covered_pounds)).toFixed(2)
        : details.amount_pounds;

    let text = `Hey ${displayName}!

Thank you so much for your generous donation to ${details.society_name}!

YOUR DONATION
-------------
Amount: £${details.amount_pounds}`;

    if (details.fee_covered_pounds) {
        text += `
Fee coverage: + £${details.fee_covered_pounds}
Total charged: £${totalPaid}`;
    }

    text += `

100% of your £${details.amount_pounds} donation goes directly to ${details.society_name}. We don't take any platform fees on donations.`;

    if (details.message) {
        text += `

YOUR MESSAGE TO THE SOCIETY:
"${details.message}"`;
    }

    text += `

Your support helps student societies continue doing amazing work - organising events, building communities, and creating opportunities for students across London.

Thank you for being awesome!

Cheers,
The LSN team

---
Questions about your donation? Contact us at hello@londonstudentnetwork.com`;

    return text;
};

export default DonationThankYouEmailFallbackPayload;
