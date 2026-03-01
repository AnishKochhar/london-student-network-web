export interface DonationNotificationDetails {
    society_name: string;
    donor_name?: string;
    donor_email: string;
    amount_pounds: string;
    fee_covered_pounds?: string;
    message?: string;
}

const DonationNotificationEmailPayload = (details: DonationNotificationDetails) => {
    const donorDisplay = details.donor_name || 'Anonymous';

    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto;">
            <p>Great news!</p>

            <p><strong>${details.society_name}</strong> just received a donation!</p>

            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; color: #047857;">Donation Received</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #065f46;">
                    £${details.amount_pounds}
                </p>
                ${details.fee_covered_pounds ? `
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #047857;">
                    Donor covered £${details.fee_covered_pounds} in fees
                </p>
                ` : ''}
            </div>

            <p><strong>Donor Details:</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; width: 120px; color: #6b7280;">Name</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${donorDisplay}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email</td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                        <a href="mailto:${details.donor_email}" style="color: #2563eb;">${details.donor_email}</a>
                    </td>
                </tr>
            </table>

            ${details.message ? `
            <p style="margin-top: 20px;"><strong>Message from the donor:</strong></p>
            <blockquote style="margin: 10px 0; padding: 15px 20px; background: #fef3c7; border-left: 3px solid #f59e0b; color: #92400e; font-style: italic; border-radius: 0 8px 8px 0;">
                "${details.message}"
            </blockquote>
            ` : ''}

            <p style="background: #f0f9ff; padding: 15px; border-left: 3px solid #3b82f6; margin: 20px 0;">
                This donation will be transferred to your connected Stripe account. Funds typically arrive within 2-7 business days.
            </p>

            <p>Consider sending a personal thank you to show your appreciation!</p>

            <p>Cheers,</p>
            <p style="margin-left: 20px;">The LSN team</p>

            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
                Questions? Contact us at <a href="mailto:hello@londonstudentnetwork.com" style="color: #007BFF;">hello@londonstudentnetwork.com</a>
            </p>
        </div>
    `;
};

export default DonationNotificationEmailPayload;
