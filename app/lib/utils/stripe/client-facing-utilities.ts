'use client'

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
