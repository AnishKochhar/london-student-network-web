interface ContactFormEmailProps {
    name: string;
    email: string;
    message: string;
    inquiryPurpose?: string;
    description?: string;
    organisation?: string;
}

const ContactFormEmail = ({
    name,
    email,
    message,
    inquiryPurpose,
    description,
    organisation
}: ContactFormEmailProps): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f9fc; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                New Contact Form Submission
            </h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">
                Someone has reached out through the contact form
            </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <div style="background-color: #f8fafc; border-left: 4px solid #667eea; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
                <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 18px;">Contact Details</h2>

                <div style="margin-bottom: 15px;">
                    <label style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">
                        Name
                    </label>
                    <p style="color: #2d3748; margin: 0; font-size: 16px; font-weight: 500;">
                        ${name}
                    </p>
                </div>

                <div style="margin-bottom: 15px;">
                    <label style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">
                        Email Address
                    </label>
                    <p style="margin: 0;">
                        <a href="mailto:${email}" style="color: #667eea; text-decoration: none; font-size: 16px; font-weight: 500;">
                            ${email}
                        </a>
                    </p>
                </div>

                ${inquiryPurpose ? `
                <div style="margin-bottom: 15px;">
                    <label style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">
                        Inquiry Purpose
                    </label>
                    <p style="color: #2d3748; margin: 0; font-size: 16px; font-weight: 500;">
                        ${inquiryPurpose}
                    </p>
                </div>
                ` : ''}

                ${description ? `
                <div style="margin-bottom: 15px;">
                    <label style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">
                        Description
                    </label>
                    <p style="color: #2d3748; margin: 0; font-size: 16px; font-weight: 500;">
                        ${description}
                    </p>
                </div>
                ` : ''}

                ${organisation ? `
                <div style="margin-bottom: 0;">
                    <label style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 5px;">
                        Organisation
                    </label>
                    <p style="color: #2d3748; margin: 0; font-size: 16px; font-weight: 500;">
                        ${organisation}
                    </p>
                </div>
                ` : ''}
            </div>

            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
                <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px;">Message</h2>
                <p style="color: #4a5568; line-height: 1.6; margin: 0; white-space: pre-wrap; word-wrap: break-word;">
                    ${message}
                </p>
            </div>

            <!-- Quick Actions -->
            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                    Reply to ${name}
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #718096; font-size: 12px; margin: 0;">
                This email was sent from the contact form at londonstudentnetwork.com
            </p>
            <p style="color: #a0aec0; font-size: 11px; margin: 10px 0 0 0;">
                Timestamp: ${new Date().toLocaleString('en-GB', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                    timeZone: 'Europe/London'
                })}
            </p>
        </div>
    </div>
</body>
</html>
    `.trim();
};

export default ContactFormEmail;