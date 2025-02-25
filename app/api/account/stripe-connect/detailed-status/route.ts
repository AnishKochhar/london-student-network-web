import { NextResponse } from "next/server";
import { fetchAccountId } from "@/app/lib/data";
import { getSecretStripePromise } from "@/app/lib/singletons-private";
import { auth } from "@/auth";
import { StripeConnectApplicationAlternative, StripeConnectApplicationError, StripeConnectApplicationDisabledReason } from "@/app/lib/types/payments";
import { NOT_FOUND } from "@/app/lib/types/general";

const stripe = await getSecretStripePromise();

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();
    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify that the requesting user is authorized.
    const session = await auth();
    if (session.user.id !== user_id) {
      return NextResponse.json(
        { error: "Permission denied to view resource" },
        { status: 403 }
      );
    }

    // Get the Stripe account ID for this user.
    const response = await fetchAccountId(user_id);
    if (!response.success) {
      return NextResponse.json(
        { // typeof NOT_FOUND is a custom type for ease of differentation between failure to extract details vs details N/A for Stripe
          cardPaymentsCapabilityStatus: 'inconclusive',
          bankTransferCapabilityStatus: 'inconclusive',
          payoutsCapabilityStatus: 'inconclusive',
          stripeConnectOnboardingStatus: 'inconclusive',
          details: {
            currently_due: NOT_FOUND,
            alternatives: NOT_FOUND,
            eventuallyDue: NOT_FOUND,
            currentDeadline: NOT_FOUND,
            pastDue: NOT_FOUND,
            pendingVerification: NOT_FOUND,
            errors: NOT_FOUND,
            disabledReason: NOT_FOUND,
            futureRequirements: NOT_FOUND,
            futureRequirementsAlternatives: NOT_FOUND,
            eventuallyDueWithNewCompliance: NOT_FOUND,
            futureDeadlines: NOT_FOUND,
            futureRequirementsPastDue: NOT_FOUND,
            futurePendingVerification: NOT_FOUND,
            futureErrors: NOT_FOUND,
            futureDisabledReason: NOT_FOUND,
            detailsSubmitted: NOT_FOUND,
            accountType: NOT_FOUND,
          }
        },
        { status: 500 }
      );
    }
    if (!response.accountId) {
      return NextResponse.json(
        { 
          cardPaymentsCapabilityStatus: 'inactive',
          bankTransferCapabilityStatus: 'inactive',
          payoutsCapabilityStatus: false,
          stripeConnectOnboardingStatus: "not started",
          details: {
            currently_due: null,
            alternatives: null,
            eventuallyDue: null,
            currentDeadline: null,
            pastDue: null,
            pendingVerification: null,
            errors: null,
            disabledReason: null,
            futureRequirements: null,
            futureRequirementsAlternatives: null,
            eventuallyDueWithNewCompliance: null,
            futureDeadlines: null,
            futureRequirementsPastDue: null,
            futurePendingVerification: null,
            futureErrors: null,
            futureDisabledReason: null,
            detailsSubmitted: null,
            accountType: null,
          }
        },
        { status: 200 }
      );
    }
    const accountId = response.accountId;

    // Retrieve the Stripe account details.
    const stripeAccount = await stripe.accounts.retrieve(accountId);

    // Compute the statuses.
    const cardPaymentsCapabilityStatus = stripeAccount.capabilities.card_payments; // ('active' | 'inactive' | 'pending';)
    const bankTransferCapabilityStatus = stripeAccount.capabilities.transfers; // ('active' | 'inactive' | 'pending';)
    const payoutsCapabilityStatus = stripeAccount.payouts_enabled; // (boolean;)


    // Build a complete requirements object with defaults for SEO.
    const reqs = stripeAccount.requirements;
    const future_reqs = stripeAccount.future_requirements;


    // Details interface put here for ease for developer. Can be imported from payments.ts types file instead.
    interface details {
        currentlyDue: Array<string> | null | typeof NOT_FOUND;
        alternatives: Array<StripeConnectApplicationAlternative> | null | typeof NOT_FOUND;
        eventuallyDue: Array<string> | null | typeof NOT_FOUND;
        currentDeadline: number | null | typeof NOT_FOUND;
        pastDue: Array<string> | null | typeof NOT_FOUND;
        pendingVerification: Array<string> | null | typeof NOT_FOUND;
        errors: Array<StripeConnectApplicationError> | null | typeof NOT_FOUND;
        disabledReason: StripeConnectApplicationDisabledReason | null | typeof NOT_FOUND;
        futureRequirements: Array<string> | null | typeof NOT_FOUND;
        futureRequirementsAlternatives: Array<StripeConnectApplicationAlternative> | null | typeof NOT_FOUND;
        eventuallyDueWithNewCompliance: Array<string> | null | typeof NOT_FOUND;
        futureDeadlines: number | null | typeof NOT_FOUND;
        futureRequirementsPastDue: Array<string> | null | typeof NOT_FOUND;
        futurePendingVerification: Array<string> | null | typeof NOT_FOUND;
        futureErrors: Array<StripeConnectApplicationError> | null | typeof NOT_FOUND;
        futureDisabledReason: StripeConnectApplicationDisabledReason | null | typeof NOT_FOUND;
        detailsSubmitted: boolean | typeof NOT_FOUND;
        accountType: 'custom' | 'express' | 'none' | 'standard' | typeof NOT_FOUND;
    }


    const details = {
      currentlyDue: reqs.currently_due,
      alternatives: reqs.alternatives, // array of objects with string attributes original_fields_due and alternative_fields_due
      eventuallyDue: reqs.eventually_due,
      currentDeadline: reqs.current_deadline,
      pastDue: reqs.past_due,
      pendingVerification: reqs.pending_verification,
      errors: reqs.errors,
      disabledReason: reqs.disabled_reason,
      futureRequirements: future_reqs.currently_due,
      futureRequirementsAlternatives: future_reqs.alternatives,
      eventuallyDueWithNewCompliance: future_reqs.eventually_due,
      futureDeadlines: future_reqs.current_deadline,
      futureRequirementsPastDue: future_reqs.past_due,
      futurePendingVerification: reqs.pending_verification,
      futureErrors: future_reqs.errors,
      futureDisabledReason: future_reqs.disabled_reason,
      detailsSubmitted: stripeAccount.details_submitted,
      accountType: stripeAccount.type
    };

    // Determine the Stripe Connect onboarding status.
    let stripeConnectOnboardingStatus:
    | "inconclusive"
    | "not started"
    | "action required"
    | "under review"
    | "approved"
    | "evidence rejected"
    | "error"
    | "disabled" = "approved";

    if (details.disabledReason) {
        stripeConnectOnboardingStatus = "disabled";
      } else if (Array.isArray(details.errors) && details.errors.length > 0) {
        stripeConnectOnboardingStatus = "evidence rejected";
      } else if (
            (Array.isArray(details.currentlyDue) && details.currentlyDue.length > 0 &&
            Array.isArray(details.alternatives) && details.alternatives.length > 0) || 
            (Array.isArray(details.pastDue) && details.pastDue.length > 0) || 
            (Array.isArray(details.futureRequirements) && details.futureRequirements.length > 0) || 
            (Array.isArray(details.futureRequirementsPastDue) && details.futureRequirementsPastDue.length > 0 &&
            Array.isArray(details.futureRequirementsAlternatives) && details.futureRequirementsAlternatives.length > 0) )
        {
        stripeConnectOnboardingStatus = "action required";
      } else if (
            details.detailsSubmitted &&
            (( Array.isArray(details.pendingVerification) &&
            details.pendingVerification.length > 0 ) ||
            ( Array.isArray(details.futurePendingVerification) &&
            details.futurePendingVerification.length > 0 )) )
        {
        stripeConnectOnboardingStatus = "under review";
      } else if (details.detailsSubmitted) {
        stripeConnectOnboardingStatus = "approved";
      } else {
        stripeConnectOnboardingStatus = "inconclusive";
      }

    return NextResponse.json(
      {
        cardPaymentsCapabilityStatus,
        bankTransferCapabilityStatus,
        payoutsCapabilityStatus,
        stripeConnectOnboardingStatus,
        details
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching Stripe Connect status:", error);
    return NextResponse.json(
      { error: "Failed to fetch Stripe Connect status" },
      { status: 500 }
    );
  }
}
