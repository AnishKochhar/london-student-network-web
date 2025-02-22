'use client';

import { useEffect, useState } from "react";
import { NOT_FOUND } from "@/app/lib/types/general";
import { details } from "@/app/lib/types/payments";
import { getVerificationFieldDescription } from "@/app/lib/utils/stripe/client-facing-utilities";

// Define types for basic statuses
type CardPaymentsStatus = 'loading' | 'inconclusive' | 'active' | 'inactive' | 'pending';
type BankTransferStatus = 'loading' | 'inconclusive' | 'active' | 'inactive' | 'pending'; 
type PayoutsStatus = 'loading' | 'inconclusive' | boolean;
type StripeConnectOnboardingStatus =
  | 'loading'
  | 'inconclusive'
  | 'not started'
  | 'more info required'
  | 'under review'
  | 'approved'
  | 'rejected'
  | 'disabled';

// Basic response interface
interface StripeConnectStatusResponse {
  cardPaymentsCapabilityStatus?: CardPaymentsStatus;
  bankTransferCapabilityStatus?: BankTransferStatus;
  payoutsCapabilityStatus?: PayoutsStatus;
  stripeConnectOnboardingStatus: StripeConnectOnboardingStatus;
}

// Extended response interface
interface ExtendedStripeConnectStatusResponse extends StripeConnectStatusResponse {
  details: details;
}

const defaultDetails: details = {
  currentlyDue: NOT_FOUND as typeof NOT_FOUND,
  alternatives: NOT_FOUND as typeof NOT_FOUND,
  eventuallyDue: NOT_FOUND as typeof NOT_FOUND,
  currentDeadline: NOT_FOUND as typeof NOT_FOUND,
  pastDue: NOT_FOUND as typeof NOT_FOUND,
  pendingVerification: NOT_FOUND as typeof NOT_FOUND,
  errors: NOT_FOUND as typeof NOT_FOUND,
  disabledReason: NOT_FOUND as typeof NOT_FOUND,
  futureRequirements: NOT_FOUND as typeof NOT_FOUND,
  futureRequirementsAlternatives: NOT_FOUND as typeof NOT_FOUND,
  eventuallyDueWithNewCompliance: NOT_FOUND as typeof NOT_FOUND,
  futureDeadlines: NOT_FOUND as typeof NOT_FOUND,
  futureRequirementsPastDue: NOT_FOUND as typeof NOT_FOUND,
  futurePendingVerification: NOT_FOUND as typeof NOT_FOUND,
  futureErrors: NOT_FOUND as typeof NOT_FOUND,
  futureDisabledReason: NOT_FOUND as typeof NOT_FOUND,
  detailsSubmitted: NOT_FOUND as typeof NOT_FOUND,
  accountType: NOT_FOUND as typeof NOT_FOUND,
};

export default function StripeConnectDetailedStatus({ id }: { id: string }) {
  const [cardPaymentsStatus, setCardPaymentsStatus] = useState<CardPaymentsStatus>('loading');
  const [bankTransferCapabilityStatus, setBankTransferCapabilityStatus] = useState<BankTransferStatus>('loading');
  const [payoutsEnabled, setPayoutsEnabled] = useState<PayoutsStatus>('loading');
  const [stripeConnectOnboardingStatus, setStripeConnectOnboardingStatus] = useState<StripeConnectOnboardingStatus>('loading');
  const [requirementsDetails, setRequirementsDetails] = useState<details>(defaultDetails);

  const [showDetails, setShowDetails] = useState(false);

  const [showCurrentlyDue, setShowCurrentlyDue] = useState(false);


  // Fetch detailed status from the backend API on component mount.
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/account/stripe-connect/detailed-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: id }),
        });
        if (!res.ok) {
          console.error("Failed to fetch status:", res.statusText);
          return;
        }
        const data: ExtendedStripeConnectStatusResponse = await res.json();
        setCardPaymentsStatus(data.cardPaymentsCapabilityStatus);
        setBankTransferCapabilityStatus(data.bankTransferCapabilityStatus);
        setPayoutsEnabled(data.payoutsCapabilityStatus);
        setStripeConnectOnboardingStatus(data.stripeConnectOnboardingStatus);
        setRequirementsDetails(data.details);
      } catch (error) {
        console.error("Error fetching Stripe Connect status:", error);
        setCardPaymentsStatus('inconclusive');
        setBankTransferCapabilityStatus('inconclusive');
        setPayoutsEnabled('inconclusive');
        setStripeConnectOnboardingStatus('inconclusive');
        setRequirementsDetails(defaultDetails);
      }
    }
    fetchStatus();
  }, []);

  // Helper: Map a status to a DaisyUI badge class.
  function getBadgeClass(status: number | string | boolean | typeof NOT_FOUND | Array<any>): string {
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

  // Helper to display a value.
  // If the value is NOT_FOUND or null, show an error badge with "N/A".
  // For arrays, join the values (or show "None" if empty).
  function displayValue(value: any) {
    if (value === NOT_FOUND || value === null) {
      return <span className="badge badge-error">N/A</span>;
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : <span className="badge badge-error">None</span>;
    }
    return value.toString();
  }

  // Helper to pretty-print keys from camelCase to "camel Case".
  function prettyKey(key: string) {
    return key.replace(/([A-Z])/g, ' $1').toLowerCase();
  }

  return (
    <>
      <h2 className="text-2xl italic mb-2 ml-2">Stripe Connect</h2>
      <div className="pb-4 mb-10 space-y-6">
        {/* Card Payments Status */}
        <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Card Payments: <span className={`${getBadgeClass(cardPaymentsStatus)} ml-2`}>{cardPaymentsStatus}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap w-2/3">
            This must be active to accept card payments from users.
          </p>
        </div>

        {/* Bank Transfers Status */}
        <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Bank Transfers: <span className={`${getBadgeClass(bankTransferCapabilityStatus)} ml-2`}>{bankTransferCapabilityStatus}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap w-2/3">
            This must be active for LSN to direct payments to your Connected Stripe Express account.
          </p>
        </div>

        {/* Payouts Status */}
        <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Payouts Enabled: <span className={`${getBadgeClass(payoutsEnabled)} ml-2`}>{payoutsEnabled.toString()}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap w-2/3">
            This is required for you to withdraw funds from your Stripe Express account.
          </p>
        </div>

        {/* Stripe Connect Onboarding Status */}
        <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Stripe Connect Account Status: <span className={`${getBadgeClass(stripeConnectOnboardingStatus)} ml-2`}>{stripeConnectOnboardingStatus}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap w-2/3">
            The general status of your Stripe Connect Account Application.
          </p>
        </div>

        {/* Toggle Button for Additional Details */}
        <div>
          <button
            className="btn btn-info mt-4"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? "Hide Additional Details" : "Show Additional Details"}
          </button>
        </div>

        {/* Additional Details Section */}
        {showDetails && (
          <div className="mt-6 space-y-6">
            {/* Currently Due (Array<string>) */}
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                  Currently Due:{" "}
                  <span className={`${getBadgeClass(requirementsDetails.currentlyDue)} ml-2 mt-2`}>
                    {requirementsDetails.currentlyDue !== NOT_FOUND && (
                      <button onClick={() => setShowCurrentlyDue(!showCurrentlyDue)}>
                        <p>Show Currently Due</p>
                      </button>
                    )}
                  </span>
                </h3>
              </div>
              {requirementsDetails.currentlyDue !== NOT_FOUND && showCurrentlyDue && (
                <div className="mt-4">
                  {Array.isArray(requirementsDetails.currentlyDue)
                    ? requirementsDetails.currentlyDue.map((field, index) => (
                        <p key={index} className="mb-1">
                          {getVerificationFieldDescription(field)}
                        </p>
                      ))
                    : <p>{getVerificationFieldDescription(requirementsDetails.currentlyDue)}</p>}
                </div>
              )}
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields currently due for submission.
              </p>
            </div>

            {/* Alternatives (Array<StripeConnectApplicationAlternative>) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Alternatives:{" "}
                <span className={`${getBadgeClass(requirementsDetails.alternatives)} ml-2`}>
                  {Array.isArray(requirementsDetails.alternatives)
                    ? requirementsDetails.alternatives
                        .map((alt) =>
                          typeof alt === "string"
                            ? alt
                            : JSON.stringify(alt)
                        )
                        .join(", ")
                    : displayValue(requirementsDetails.alternatives)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Alternative options available.
              </p>
            </div>

            {/* Eventually Due (Array<string>) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Eventually Due:{" "}
                <span className={`${getBadgeClass(requirementsDetails.eventuallyDue)} ml-2`}>
                  {Array.isArray(requirementsDetails.eventuallyDue)
                    ? requirementsDetails.eventuallyDue.join(", ")
                    : displayValue(requirementsDetails.eventuallyDue)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields that will eventually be required.
              </p>
            </div> */}

            {/* Current Deadline (number) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Current Deadline:{" "}
                <span className={`${getBadgeClass(requirementsDetails.currentDeadline)} ml-2`}>
                  {typeof requirementsDetails.currentDeadline === "number"
                    ? requirementsDetails.currentDeadline
                    : 'N/A'}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Deadline for current requirements (timestamp).
              </p>
            </div>

            {/* Past Due (Array<string>) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Past Due:{" "}
                <span className={`${getBadgeClass(requirementsDetails.pastDue)} ml-2`}>
                  {Array.isArray(requirementsDetails.pastDue)
                    ? requirementsDetails.pastDue.join(", ")
                    : displayValue(requirementsDetails.pastDue)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields that are past due.
              </p>
            </div>

            {/* Pending Verification (Array<string>) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Pending Verification:{" "}
                <span className={`${getBadgeClass(requirementsDetails.pendingVerification)} ml-2`}>
                  {Array.isArray(requirementsDetails.pendingVerification)
                    ? requirementsDetails.pendingVerification.join(", ")
                    : displayValue(requirementsDetails.pendingVerification)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields pending verification.
              </p>
            </div>

            {/* Errors (Array<StripeConnectApplicationError>) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Errors:{" "}
                <span className={`${getBadgeClass(requirementsDetails.errors)} ml-2`}>
                  {Array.isArray(requirementsDetails.errors)
                    ? requirementsDetails.errors
                        .map((err) => JSON.stringify(err))
                        .join(", ")
                    : displayValue(requirementsDetails.errors)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Errors encountered during processing.
              </p>
            </div>

            {/* Disabled Reason */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Disabled Reason:{" "}
                <span className={`${getBadgeClass(requirementsDetails.disabledReason)} ml-2`}>
                  {requirementsDetails.disabledReason &&
                  typeof requirementsDetails.disabledReason === "object"
                    ? JSON.stringify(requirementsDetails.disabledReason)
                    : displayValue(requirementsDetails.disabledReason)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Reason for any disablement.
              </p>
            </div>

            {/* Future Requirements (Array<string>) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Future Requirements:{" "}
                <span className={`${getBadgeClass(requirementsDetails.futureRequirements)} ml-2`}>
                  {Array.isArray(requirementsDetails.futureRequirements)
                    ? requirementsDetails.futureRequirements.join(", ")
                    : displayValue(requirementsDetails.futureRequirements)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields required in the future.
              </p>
            </div> */}

            {/* Future Requirements Alternatives (Array<StripeConnectApplicationAlternative>) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Future Requirements Alternatives:{" "}
                <span className={`${getBadgeClass(requirementsDetails.futureRequirementsAlternatives)} ml-2`}>
                  {Array.isArray(requirementsDetails.futureRequirementsAlternatives)
                    ? requirementsDetails.futureRequirementsAlternatives
                        .map((alt) =>
                          typeof alt === "string"
                            ? alt
                            : JSON.stringify(alt)
                        )
                        .join(", ")
                    : displayValue(requirementsDetails.futureRequirementsAlternatives)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Alternatives for future requirements.
              </p>
            </div> */}

            {/* Eventually Due With New Compliance (Array<string>) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Eventually Due With New Compliance:{" "}
                <span className={`${getBadgeClass(requirementsDetails.eventuallyDueWithNewCompliance)} ml-2`}>
                  {Array.isArray(requirementsDetails.eventuallyDueWithNewCompliance)
                    ? requirementsDetails.eventuallyDueWithNewCompliance.join(", ")
                    : displayValue(requirementsDetails.eventuallyDueWithNewCompliance)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields required under new compliance rules.
              </p>
            </div> */}

            {/* Future Deadlines (number) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Future Deadlines:{" "}
                <span className={`btn btn-accent ml-2`}>
                  {typeof requirementsDetails.futureDeadlines === "number"
                    ? requirementsDetails.futureDeadlines
                    : displayValue(requirementsDetails.futureDeadlines)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Upcoming deadlines for future requirements.
              </p>
            </div> */}

            {/* Future Requirements Past Due (Array<string>) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Future Requirements Past Due:{" "}
                <span className={`${getBadgeClass(requirementsDetails.futureRequirementsPastDue)} ml-2`}>
                  {Array.isArray(requirementsDetails.futureRequirementsPastDue)
                    ? requirementsDetails.futureRequirementsPastDue.join(", ")
                    : displayValue(requirementsDetails.futureRequirementsPastDue)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Future requirements that are already past due.
              </p>
            </div> */}

            {/* Future Pending Verification (Array<string>) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Future Pending Verification:{" "}
                <span className={`${getBadgeClass(requirementsDetails.futurePendingVerification)} ml-2`}>
                  {Array.isArray(requirementsDetails.futurePendingVerification)
                    ? requirementsDetails.futurePendingVerification.join(", ")
                    : displayValue(requirementsDetails.futurePendingVerification)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields pending verification in the future.
              </p>
            </div> */}

            {/* Future Errors (Array<StripeConnectApplicationError>) */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Future Errors:{" "}
                <span className={`${getBadgeClass(requirementsDetails.futureErrors)} ml-2`}>
                  {Array.isArray(requirementsDetails.futureErrors)
                    ? requirementsDetails.futureErrors
                        .map((err) => JSON.stringify(err))
                        .join(", ")
                    : displayValue(requirementsDetails.futureErrors)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Any future errors.
              </p>
            </div> */}

            {/* Future Disabled Reason */}
            {/* <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Future Disabled Reason:{" "}
                <span className={`${getBadgeClass(requirementsDetails.futureDisabledReason)} ml-2`}>
                  {requirementsDetails.futureDisabledReason &&
                  typeof requirementsDetails.futureDisabledReason === "object"
                    ? JSON.stringify(requirementsDetails.futureDisabledReason)
                    : displayValue(requirementsDetails.futureDisabledReason)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Reason for future disablement.
              </p>
            </div> */}

            {/* Details Submitted (boolean) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Details Submitted:{" "}
                <span className={`${getBadgeClass(requirementsDetails.detailsSubmitted)} ml-2`}>
                  {typeof requirementsDetails.detailsSubmitted === "boolean"
                    ? requirementsDetails.detailsSubmitted.toString()
                    : displayValue(requirementsDetails.detailsSubmitted)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Whether the required details have been submitted.
              </p>
            </div>

            {/* Account Type (enum) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Account Type:{" "}
                <span className={`${getBadgeClass(requirementsDetails.accountType)} ml-2`}>
                  {typeof requirementsDetails.accountType === "string"
                    ? requirementsDetails.accountType
                    : displayValue(requirementsDetails.accountType)}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                The type of Stripe Connect account.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
