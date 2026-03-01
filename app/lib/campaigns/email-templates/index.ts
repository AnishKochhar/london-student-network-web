// ============================================
// Email Templates Module
// ============================================

// Base template utilities
export {
    wrapWithLSNBranding,
    htmlToPlainText,
    replaceVariables,
    extractVariables,
    type BaseTemplateOptions,
    type SignatureData,
} from './base-template';

// Pre-built templates
export {
    SOCIETY_OUTREACH_INTRO,
    SOCIETY_OUTREACH_PROOF,
    SOCIETY_OUTREACH_URGENCY,
    SOCIETY_OUTREACH_FOLLOWUP,
    SOCIETY_OUTREACH_TEMPLATES,
    templateContentToEmailTemplate,
    type TemplateContent,
} from './society-outreach-templates';
