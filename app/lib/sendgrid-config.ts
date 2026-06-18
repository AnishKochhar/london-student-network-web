import sgMail from "@sendgrid/mail";

// ================================
// sendgrid initialization
// ================================

// Configure the key only when present. We intentionally do NOT throw when it
// is missing: importing this module during `next build` (where the key may be
// absent) must not crash. Callers handle send failures themselves.
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export { sgMail };
