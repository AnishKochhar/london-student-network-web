import sgMail from '@sendgrid/mail';

// ================================
// sendgrid initialization
// ================================

if (!process.env.SENDGRID_API_KEY) {
	console.error('SendGrid API key is missing!');
	throw new Error('SENDGRID_API_KEY environment variable not set');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export { sgMail };