import { NOT_FOUND } from "./general";

export interface StripeConnectApplicationAlternative {
    /**
     * Fields that can be provided to satisfy all fields in `original_fields_due`.
     */
    alternative_fields_due: Array<string>;

    /**
     * Fields that are due and can be satisfied by providing all fields in `alternative_fields_due`.
     */
    original_fields_due: Array<string>;
}

export interface StripeConnectApplicationError {
    /**
     * The code for the type of error.
     */
    code: StripeConnectApplicationErrorCode;

    /**
     * An informative message that indicates the error type and provides additional details about the error.
     */
    reason: string;

    /**
     * The specific user onboarding requirement field (in the requirements hash) that needs to be resolved.
     */
    requirement: string;
}

export type StripeConnectApplicationErrorCode =
| 'invalid_address_city_state_postal_code'
| 'invalid_address_highway_contract_box'
| 'invalid_address_private_mailbox'
| 'invalid_business_profile_name'
| 'invalid_business_profile_name_denylisted'
| 'invalid_company_name_denylisted'
| 'invalid_dob_age_over_maximum'
| 'invalid_dob_age_under_18'
| 'invalid_dob_age_under_minimum'
| 'invalid_product_description_length'
| 'invalid_product_description_url_match'
| 'invalid_representative_country'
| 'invalid_statement_descriptor_business_mismatch'
| 'invalid_statement_descriptor_denylisted'
| 'invalid_statement_descriptor_length'
| 'invalid_statement_descriptor_prefix_denylisted'
| 'invalid_statement_descriptor_prefix_mismatch'
| 'invalid_street_address'
| 'invalid_tax_id'
| 'invalid_tax_id_format'
| 'invalid_tos_acceptance'
| 'invalid_url_denylisted'
| 'invalid_url_format'
| 'invalid_url_length'
| 'invalid_url_web_presence_detected'
| 'invalid_url_website_business_information_mismatch'
| 'invalid_url_website_empty'
| 'invalid_url_website_inaccessible'
| 'invalid_url_website_inaccessible_geoblocked'
| 'invalid_url_website_inaccessible_password_protected'
| 'invalid_url_website_incomplete'
| 'invalid_url_website_incomplete_cancellation_policy'
| 'invalid_url_website_incomplete_customer_service_details'
| 'invalid_url_website_incomplete_legal_restrictions'
| 'invalid_url_website_incomplete_refund_policy'
| 'invalid_url_website_incomplete_return_policy'
| 'invalid_url_website_incomplete_terms_and_conditions'
| 'invalid_url_website_incomplete_under_construction'
| 'invalid_url_website_other'
| 'invalid_value_other'
| 'verification_directors_mismatch'
| 'verification_document_address_mismatch'
| 'verification_document_address_missing'
| 'verification_document_corrupt'
| 'verification_document_country_not_supported'
| 'verification_document_directors_mismatch'
| 'verification_document_dob_mismatch'
| 'verification_document_duplicate_type'
| 'verification_document_expired'
| 'verification_document_failed_copy'
| 'verification_document_failed_greyscale'
| 'verification_document_failed_other'
| 'verification_document_failed_test_mode'
| 'verification_document_fraudulent'
| 'verification_document_id_number_mismatch'
| 'verification_document_id_number_missing'
| 'verification_document_incomplete'
| 'verification_document_invalid'
| 'verification_document_issue_or_expiry_date_missing'
| 'verification_document_manipulated'
| 'verification_document_missing_back'
| 'verification_document_missing_front'
| 'verification_document_name_mismatch'
| 'verification_document_name_missing'
| 'verification_document_nationality_mismatch'
| 'verification_document_not_readable'
| 'verification_document_not_signed'
| 'verification_document_not_uploaded'
| 'verification_document_photo_mismatch'
| 'verification_document_too_large'
| 'verification_document_type_not_supported'
| 'verification_extraneous_directors'
| 'verification_failed_address_match'
| 'verification_failed_business_iec_number'
| 'verification_failed_document_match'
| 'verification_failed_id_number_match'
| 'verification_failed_keyed_identity'
| 'verification_failed_keyed_match'
| 'verification_failed_name_match'
| 'verification_failed_other'
| 'verification_failed_representative_authority'
| 'verification_failed_residential_address'
| 'verification_failed_tax_id_match'
| 'verification_failed_tax_id_not_issued'
| 'verification_missing_directors'
| 'verification_missing_executives'
| 'verification_missing_owners'
| 'verification_requires_additional_memorandum_of_associations'
| 'verification_requires_additional_proof_of_registration'
| 'verification_supportability';

export type StripeConnectApplicationDisabledReason =
| 'action_required.requested_capabilities'
| 'listed'
| 'other'
| 'platform_paused'
| 'rejected.fraud'
| 'rejected.incomplete_verification'
| 'rejected.listed'
| 'rejected.other'
| 'rejected.platform_fraud'
| 'rejected.platform_other'
| 'rejected.platform_terms_of_service'
| 'rejected.terms_of_service'
| 'requirements.past_due'
| 'requirements.pending_verification'
| 'under_review';


export interface details {
    currentlyDue: Array<string> | null | typeof NOT_FOUND | 'loading';
    alternatives: Array<StripeConnectApplicationAlternative> | null | typeof NOT_FOUND | 'loading';
    eventuallyDue: Array<string> | null | typeof NOT_FOUND | 'loading';
    currentDeadline: number | null | typeof NOT_FOUND | 'loading';
    pastDue: Array<string> | null | typeof NOT_FOUND | 'loading';
    pendingVerification: Array<string> | null | typeof NOT_FOUND | 'loading';
    errors: Array<StripeConnectApplicationError> | null | typeof NOT_FOUND | 'loading';
    disabledReason: StripeConnectApplicationDisabledReason | null | typeof NOT_FOUND | 'loading';
    futureRequirements: Array<string> | null | typeof NOT_FOUND | 'loading';
    futureRequirementsAlternatives: Array<StripeConnectApplicationAlternative> | null | typeof NOT_FOUND | 'loading';
    eventuallyDueWithNewCompliance: Array<string> | null | typeof NOT_FOUND | 'loading';
    futureDeadlines: number | null | typeof NOT_FOUND | 'loading';
    futureRequirementsPastDue: Array<string> | null | typeof NOT_FOUND | 'loading';
    futurePendingVerification: Array<string> | null | typeof NOT_FOUND | 'loading';
    futureErrors: Array<StripeConnectApplicationError> | null | typeof NOT_FOUND | 'loading';
    futureDisabledReason: StripeConnectApplicationDisabledReason | null | typeof NOT_FOUND | 'loading';
    detailsSubmitted: boolean | typeof NOT_FOUND | 'loading';
    accountType: 'custom' | 'express' | 'none' | 'standard' | typeof NOT_FOUND | 'loading';
}

export interface DashboardBadge {
    badgeClass: string;
    badgeLabel: string;
}
