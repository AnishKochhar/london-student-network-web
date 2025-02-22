'use server'

import { Stripe } from "stripe";


export async function createProduct(subcurrencyAmount: number, productName: string, description: string, stripe: Stripe) {
    try {
        // Step 1: Create a new product
        const product = await stripe.products.create({
            name: productName,
            description: description || "",
        });

        // console.log("Product created:", product.id);

        // Step 2: Create a price for the product
        const price = await stripe.prices.create({
            unit_amount: subcurrencyAmount, // Price in smallest currency unit (e.g., cents)
            currency: "gbp",
            product: product.id,
        });

        // console.log("Price created:", price.id);

        return { productId: product.id, priceId: price.id };
    } catch (error) {
        console.error("Error creating product or price:", error);
        throw error;
    }
}

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
  
    // External account for payouts
    "external_account": "Bank account or debit card for payouts",
  };
  
  // Helper function to get the description for a given verification field code.
  function getVerificationFieldDescription(code: string): string {
    return verificationLookup[code] || "Unknown verification field code";
  }
  
  // Example usage:
  console.log(getVerificationFieldDescription("individual.verification.document.front"));
  // Expected output: "Front of a government-issued ID document"
