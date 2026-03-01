export interface DonationDetails {
    society_name: string;
    donor_name?: string;
    amount_pounds: string;
    fee_covered_pounds?: string;
    message?: string;
}

const DonationThankYouEmailPayload = (details: DonationDetails) => {
    const displayName = details.donor_name || 'there';
    const totalPaid = details.fee_covered_pounds
        ? (parseFloat(details.amount_pounds) + parseFloat(details.fee_covered_pounds)).toFixed(2)
        : details.amount_pounds;

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>Hey ${displayName}!</p>

            <p>Thank you so much for your generous donation to <strong>${details.society_name}</strong>!</p>

            <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #be185d;">Your Donation</p>
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #831843;">
                    £${details.amount_pounds}
                </p>
                ${details.fee_covered_pounds ? `
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #9d174d;">
                    + £${details.fee_covered_pounds} to cover transaction fees
                </p>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #9d174d;">
                    <strong>Total charged: £${totalPaid}</strong>
                </p>
                ` : ''}
            </div>

            <p style="background: #ecfdf5; padding: 15px; border-left: 3px solid #10b981; margin: 20px 0;">
                <strong>100% of your £${details.amount_pounds} donation</strong> goes directly to ${details.society_name}. We don't take any platform fees on donations.
            </p>

            ${details.message ? `
            <p><strong>Your message to the society:</strong></p>
            <blockquote style="margin: 10px 0; padding: 10px 20px; background: #f9fafb; border-left: 3px solid #d1d5db; color: #4b5563; font-style: italic;">
                "${details.message}"
            </blockquote>
            ` : ''}

            <p>Your support helps student societies continue doing amazing work - organising events, building communities, and creating opportunities for students across London.</p>

            <p>Thank you for being awesome!</p>

            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN team</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions about your donation? Contact us at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default DonationThankYouEmailPayload;
