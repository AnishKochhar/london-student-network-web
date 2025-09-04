'use client'

import { NOT_FOUND } from "../../types/general";
import { details } from "../../types/payments";

// A lookup table to transform Stripe verification field codes into meaningful outputs.
const verificationLookup: { [code: string]: string } = {
    // Individual verification fields
    "individual.first_name": "First name",
    "individual.last_name": "Last name",
    "individual.dob.day": "Day of birth",
    "individual.dob.month": "Month of birth",
    "individual.dob.year": "Year of birth",
    "individual.email": "Email address",
    "individual.phone": "Phone number",
    "individual.address.line1": "Address line 1",
    "individual.address.line2": "Address line 2",
    "individual.address.city": "Address city",
    "individual.address.state": "State or Province",
    "individual.address.postal_code": "ZIP or Postal Code",
    "individual.address.country": "Country",
    "individual.id_number": "Government-issued ID number",
    "individual.ssn_last_4": "Last four digits of Social Security Number",
    "individual.verification.document.front": "Front of a government-issued ID document",
    "individual.verification.document.back": "Back of a government-issued ID document",
    "individual.verification.additional_document.front": "Front of an additional document for address verification",
    "individual.verification.additional_document.back": "Back of an additional document for address verification",
  
    // Company verification fields
    "company.name": "Legal name of the company",
    "company.tax_id": "Tax identification number (EIN, etc.)",
    "company.phone": "Company phone number",
    "company.website": "Company website URL",
    "company.address.line1": "Street address",
    "company.address.line2": "Apartment, suite, or unit",
    "company.address.city": "City",
    "company.address.state": "State or province",
    "company.address.postal_code": "ZIP or postal code",
    "company.address.country": "Country",
    "business_profile.url": "Publicly accessible website URL",
    "business_profile.product_description": "Description of the products or services offered",
    "business_profile.mcc": "Merchant Category Code",
    "business_profile.support_email": "Customer support email",
    "business_profile.support_phone": "Customer support phone number",
    "business_profile.support_address.line1": "Support address street",
    "business_profile.support_address.line2": "Support address apartment, suite, or unit",
    "business_profile.support_address.city": "Support address city",
    "business_profile.support_address.state": "Support address state or province",
    "business_profile.support_address.postal_code": "Support address ZIP or postal code",
    "business_profile.support_address.country": "Support address country",
    "business_type": "Type of business",
  
    // Additional company/person fields
    "company.directors_provided": "Directors' information has been provided (boolean)",
    "company.owners_provided": "Owners' information has been provided (boolean)",
  
    "person.first_name": "First name of the associated person",
    "person.last_name": "Last name of the person",
    "person.email": "Email address",
    "person.phone": "Phone number",
    "person.dob.day": "Day of birth",
    "person.dob.month": "Month of birth",
    "person.dob.year": "Year of birth",
    "person.address.line1": "Street address",
    "person.address.line2": "Apartment, suite, or unit",
    "person.address.city": "City",
    "person.address.state": "State or province",
    "person.address.postal_code": "ZIP or postal code",
    "person.address.country": "Country",
    "person.id_number": "Government-issued ID number",
    "person.relationship.director": "Person is a director (boolean)",
    "person.relationship.owner": "Person is an owner (boolean)",
    "person.relationship.executive": "Person is an executive (boolean)",
    "person.relationship.representative": "Person is a representative (boolean)",
    "person.relationship.title": "Title or role of the person in the company",

    // Additional Representative and Terms of Service fields:
    "representative.address.city": "City of the representative's address",
    "representative.address.line1": "Address line 1 of the representative",
    "representative.address.line2": "Address line 2 of the representative (if available)",
    "representative.address.postal_code": "Postal code of the representative's address",
    "representative.address.country": "Country of the representative's address",
    "representative.dob.day": "Representative's day of birth",
    "representative.dob.month": "Representative's month of birth",
    "representative.dob.year": "Representative's year of birth",
    "representative.email": "Representative's email address",
    "representative.first_name": "Representative's first name",
    "representative.last_name": "Representative's last name",
    "representative.phone": "Representative's phone number",
    "representative.id_number": "Government-issued ID number of the representative",
    "representative.ssn_last_4": "Last four digits of the representative's Social Security Number",
    "representative.verification.document.front": "Front of the representative's government-issued ID",
    "representative.verification.document.back": "Back of the representative's government-issued ID",
    "representative.verification.additional_document.front": "Front of an additional document for representative verification",
    "representative.verification.additional_document.back": "Back of an additional document for representative verification",
    "tos_acceptance.date": "Timestamp when Terms of Service was accepted",
    "tos_acceptance.ip": "IP address from which Terms of Service was accepted",
  
    // External account for payouts
    "external_account": "Bank account or debit card for payouts",
};
  
// Helper function to get the description for a given verification field code.
export function getVerificationFieldDescription(code: string): string {
    return verificationLookup[code] || code;
}
  
// Example usage:
// console.log(getVerificationFieldDescription("individual.verification.document.front"));
// Expected output: "Front of a government-issued ID document"


const disabledReasonLookup: { [code: string]: string } = {
    'action_required.requested_capabilities': "Action required: Requested capabilities required",
    'listed': "Listed",
    'other': "Other reason",
    'platform_paused': "Platform paused",
    'rejected.fraud': "Rejected: Fraud detected",
    'rejected.incomplete_verification': "Rejected: Incomplete verification",
    'rejected.listed': "Rejected: Listed",
    'rejected.other': "Rejected: Other reason",
    'rejected.platform_fraud': "Rejected by platform: Fraud",
    'rejected.platform_other': "Rejected by platform: Other reason",
    'rejected.platform_terms_of_service': "Rejected by platform: Terms of service violation",
    'rejected.terms_of_service': "Rejected: Terms of service violation",
    'requirements.past_due': "Requirements are past due",
    'requirements.pending_verification': "Requirements pending verification",
    'under_review': "Under review"
};

export function getDisabledReasonLookup(code: string): string {
    return disabledReasonLookup[code] || code;
}

// Helper: Map a status to a DaisyUI badge class.
export function getBadgeClass(status: number | string | boolean | typeof NOT_FOUND | Array<any>): string {
    if (typeof status === 'boolean') {
      return status ? 'badge badge-success' : 'badge badge-error';
    }
    if (typeof status === typeof NOT_FOUND) {
      return 'badge badge-accent';
    }
    if (Array.isArray(status) && status.length > 0) {
      return 'badge badge-warning';
    }
    switch (status) {
      case 'N/A':
        return 'badge badge-success';
      case 'active':
        return 'badge badge-success';
      case 'approved':
        return 'badge badge-success';
      case 'under review':
        return 'badge badge-primary';
      case 'more info required':
        return 'badge badge-warning';
      case 'rejected':
        return 'badge badge-error';
      case 'disabled':
        return 'badge badge-error';
      case 'not started':
        return 'badge badge-accent';
      case 'inconclusive':
        return 'badge badge-info';
      case 'inactive':
        return 'badge badge-error';
      default:
        return 'badge badge-info';
    }
}

export const getCurrentlyDueBadge = (currentlyDue: details["currentlyDue"]) => {
  if (currentlyDue === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (currentlyDue === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Internal error, please try again later" };
  }
  if (currentlyDue && Array.isArray(currentlyDue) && currentlyDue.length > 0) {
    return { badgeClass: "badge badge-warning", badgeLabel: null }; // Collapsible toggle
  }
  return { badgeClass: "badge badge-success", badgeLabel: "Up to date" }; // in case there is nothing to submit
};

export const getAlternativesBadge = (currentlyDue: details["currentlyDue"], alternatives: details["alternatives"]) => {
  if (alternatives === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (alternatives === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (currentlyDue && Array.isArray(currentlyDue) && currentlyDue.length > 0) {
    if (alternatives && Array.isArray(alternatives) && alternatives.length > 0) {
      return { badgeClass: "badge badge-accent", badgeLabel: null }; // Collapsible toggle (aqua)
    }
    return { badgeClass: "badge badge-ghost", badgeLabel: "No alternatives" };
  }
  return { badgeClass: "badge badge-info", badgeLabel: "N/A" };
};

export const getCurrentDeadlineBadge = (deadline: details["currentDeadline"]) => {
  if (deadline === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (deadline === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (typeof deadline === "number") {
    return { badgeClass: "badge badge-warning", badgeLabel: deadline.toString() };
  }
  return { badgeClass: "badge badge-info", badgeLabel: "N/A" };
};

export const getPastDueBadge = (pastDue: details["pastDue"]) => {
  if (pastDue === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (pastDue === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (pastDue && Array.isArray(pastDue) && pastDue.length > 0) {
    return { badgeClass: "badge badge-error", badgeLabel: null }; // Collapsible toggle (red)
  }
  return { badgeClass: "badge badge-info", badgeLabel: "N/A" };
};

export const getPendingVerificationBadge = (pendingVerification: details["pendingVerification"]) => {
  if (pendingVerification === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (pendingVerification === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (pendingVerification && Array.isArray(pendingVerification) && pendingVerification.length > 0) {
    return { badgeClass: "badge badge-warning", badgeLabel: null }; // Collapsible toggle (yellow)
  }
  return { badgeClass: "badge badge-info", badgeLabel: "N/A" };
};

export const getErrorsBadge = (errors: details["errors"]) => {
  if (errors === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (errors === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (errors && Array.isArray(errors) && errors.length > 0) {
    const msg = errors.map((err) => err.reason).join(", ");
    return { badgeClass: "badge badge-error", badgeLabel: msg };
  }
  return { badgeClass: "badge badge-info", badgeLabel: "N/A" };
};

export const getDisabledReasonBadge = (disabledReason: details["disabledReason"]) => {
  if (disabledReason === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (disabledReason === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (disabledReason) {
    return { badgeClass: "badge badge-error", badgeLabel: null }; // Collapsible toggle (red)
  }
  return { badgeClass: "badge badge-info", badgeLabel: "N/A" };
};

export const getDetailsSubmittedBadge = (detailsSubmitted: details["detailsSubmitted"]) => {
  if (detailsSubmitted === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (detailsSubmitted === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (typeof detailsSubmitted === "boolean") {
    return detailsSubmitted
      ? { badgeClass: "badge badge-success", badgeLabel: "True" }
      : { badgeClass: "badge badge-error", badgeLabel: "False" };
  }
  return { badgeClass: "badge badge-secondary", badgeLabel: "Unexpected error. Please contact support." };
};

export const getAccountTypeBadge = (accountType: details["accountType"]) => {
  if (accountType === 'loading') {
    return { badgeClass: "badge badge-info", badgeLabel: "loading" };
  }
  if (accountType === NOT_FOUND) {
    return { badgeClass: "badge badge-secondary", badgeLabel: "Error, please try again later" };
  }
  if (typeof accountType === "string" && accountType.trim() !== "") {
    return { badgeClass: "badge badge-primary", badgeLabel: accountType };
  }
  return { badgeClass: "badge badge-primary", badgeLabel: "Unexpected error. Please contact support." };
};

export const getLoadingBadge = () => {
  return { badgeClass: "badge badge-info", badgeLabel: "loading" };
}

// Group together for ease
export const BadgeUtils = {
    getCurrentlyDueBadge,
    getAlternativesBadge,
    getCurrentDeadlineBadge,
    getPastDueBadge,
    getPendingVerificationBadge,
    getErrorsBadge,
    getDisabledReasonBadge,
    getDetailsSubmittedBadge,
    getAccountTypeBadge,
    getLoadingBadge
};
