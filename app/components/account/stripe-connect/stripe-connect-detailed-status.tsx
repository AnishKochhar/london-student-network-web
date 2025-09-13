'use client';

import { useEffect, useState } from "react";
import { NOT_FOUND } from "@/app/lib/types/general";
import { details, DashboardBadge } from "@/app/lib/types/payments";
import { BadgeUtils, getDisabledReasonLookup, getVerificationFieldDescription } from "@/app/lib/utils/stripe/client-facing-utilities";
import { CollapsibleToggle } from "../../general/toggle";
import { getStripeConnectPromiseForStandardDashboard } from "@/app/lib/singletons-public";
import { ConnectComponentsProvider, ConnectAccountManagement, ConnectBalances, ConnectDocuments, ConnectPayments, ConnectPayouts, ConnectNotificationBanner, ConnectTaxRegistrations, ConnectTaxSettings } from "@stripe/react-connect-js";
import { StripeConnectInstance } from "@stripe/connect-js";
import { Button } from '@/app/components/button';


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
  currentlyDue: 'loading',
  alternatives: 'loading',
  eventuallyDue: 'loading',
  currentDeadline: 'loading',
  pastDue: 'loading',
  pendingVerification: 'loading',
  errors: 'loading',
  disabledReason: 'loading',
  futureRequirements: 'loading',
  futureRequirementsAlternatives: 'loading',
  eventuallyDueWithNewCompliance: 'loading',
  futureDeadlines: 'loading',
  futureRequirementsPastDue: 'loading',
  futurePendingVerification: 'loading',
  futureErrors: 'loading',
  futureDisabledReason: 'loading',
  detailsSubmitted: 'loading',
  accountType: 'loading',
};

type StripeConnectState =
  | { status: 'loading' }
  | { status: 'ready'; instance: StripeConnectInstance }
  | { status: 'null' };

export default function StripeConnectDetailedStatus({ id }: { id: string }) {
  // const [cardPaymentsStatus, setCardPaymentsStatus] = useState<CardPaymentsStatus>('loading');
  const [bankTransferCapabilityStatus, setBankTransferCapabilityStatus] = useState<BankTransferStatus>('loading');
  const [payoutsEnabled, setPayoutsEnabled] = useState<PayoutsStatus>('loading');
  const [stripeConnectOnboardingStatus, setStripeConnectOnboardingStatus] = useState<StripeConnectOnboardingStatus>('loading');
  const [requirementsDetails, setRequirementsDetails] = useState<details>(defaultDetails); // make it default initially to a loading state

  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showStripeDashboard, setShowStripeDashboard] = useState<boolean>(false);

  const [showCurrentlyDue, setShowCurrentlyDue] = useState<boolean>(false);
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);
  const [showPastDue, setShowPastDue] = useState<boolean>(false);
  const [showPendingVerification, setShowPendingVerification] = useState<boolean>(false);
  const [showDisabledReason, setShowDisabledReason] = useState<boolean>(false);

  const [currentlyDueBadge, setCurrentlyDueBadge] = useState<DashboardBadge>(BadgeUtils.getLoadingBadge());
  const [alternativesBadge, setAlternativesBadge] = useState<DashboardBadge>(BadgeUtils.getLoadingBadge());
  const [currentDeadlineBadge, setCurrentDeadlineBadge] = useState<DashboardBadge>(BadgeUtils.getLoadingBadge());
  const [pastDueBadge, setPastDueBadge] = useState<DashboardBadge>(BadgeUtils.getLoadingBadge());
  const [pendingVerificationBadge, setPendingVerificationBadge] = useState<DashboardBadge>(BadgeUtils.getLoadingBadge());
  const [errorsBadge, setErrorsBadge] = useState<DashboardBadge>(BadgeUtils.getLoadingBadge());
  const [disabledReasonBadge, setDisabledReasonBadge] = useState<DashboardBadge>(BadgeUtils.getLoadingBadge());

  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [stripeConnectInstance, setStripeConnectInstance] = useState<StripeConnectState>({ status: null });

  useEffect(() => {
      const initializeStripeConnect = async () => {
          try {
              if (requirementsDetails.detailsSubmitted === true){
                setStripeConnectInstance({ status: 'loading' })
                const { instance } = await getStripeConnectPromiseForStandardDashboard(id);
                setStripeConnectInstance({ status: 'ready', instance });
              }
          } catch (error) {
              console.error('Error fetching Stripe Connect instance:', error);
              setDashboardError('Failed to fetch Stripe Connect instance.');
          }
      };

      initializeStripeConnect();
  }, [requirementsDetails]);

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
          console.error("Failed to fetch stripe status:", res.statusText);
          return;
        }
        const data: ExtendedStripeConnectStatusResponse = await res.json();
        // setCardPaymentsStatus(data.cardPaymentsCapabilityStatus);
        setBankTransferCapabilityStatus(data.bankTransferCapabilityStatus);
        setPayoutsEnabled(data.payoutsCapabilityStatus);
        setStripeConnectOnboardingStatus(data.stripeConnectOnboardingStatus);
        setRequirementsDetails(data.details);
      } catch (error) {
        console.error("Error fetching Stripe Connect status:", error);
        // setCardPaymentsStatus('inconclusive');
        setBankTransferCapabilityStatus('inconclusive');
        setPayoutsEnabled('inconclusive');
        setStripeConnectOnboardingStatus('inconclusive');
        setRequirementsDetails(defaultDetails);
      }
    }
    fetchStatus();
  }, []);

  useEffect(() => { // Currently Due Badge
    setCurrentlyDueBadge(BadgeUtils.getCurrentlyDueBadge(requirementsDetails.currentlyDue));
  }, [requirementsDetails.currentlyDue]);

  useEffect(() => { // Alternative Badge
    setAlternativesBadge(BadgeUtils.getAlternativesBadge(requirementsDetails.currentlyDue, requirementsDetails.alternatives));
  }, [requirementsDetails.currentlyDue, requirementsDetails.alternatives]);

  useEffect(() => { // Currently Deadline Badge
    setCurrentDeadlineBadge(BadgeUtils.getCurrentDeadlineBadge(requirementsDetails.currentDeadline));
  }, [requirementsDetails.currentDeadline]);

  useEffect(() => { // Past Due Badge
    setPastDueBadge(BadgeUtils.getPastDueBadge(requirementsDetails.pastDue));
  }, [requirementsDetails.pastDue]);

  useEffect(() => { // Pending Verification Badge
    setPendingVerificationBadge(BadgeUtils.getPendingVerificationBadge(requirementsDetails.pendingVerification));
  }, [requirementsDetails.pendingVerification]);

  useEffect(() => { // Errors Badge
    setErrorsBadge(BadgeUtils.getErrorsBadge(requirementsDetails.errors));
  }, [requirementsDetails.errors]);

  useEffect(() => { // Disabled Reason Badge
    setDisabledReasonBadge(BadgeUtils.getDisabledReasonBadge(requirementsDetails.disabledReason));
  }, [requirementsDetails.disabledReason]);

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
  // function displayValue(value: any) {
  //   if (value === NOT_FOUND || value === null) {
  //     return <span className="badge badge-error">N/A</span>;
  //   }
  //   if (Array.isArray(value)) {
  //     return value.length > 0 ? value.join(', ') : <span className="badge badge-error">None</span>;
  //   }
  //   return value.toString();
  // }

  // Helper to pretty-print keys from camelCase to "camel Case".
  // function prettyKey(key: string) {
  //   return key.replace(/([A-Z])/g, ' $1').toLowerCase();
  // }

  return (
    <>
      <h2 className="text-2xl italic mb-5 ml-2">Stripe Connect</h2>
      <div className="pb-4 mb-10 space-y-6">
        {/* Card Payments Status */}
        {/* <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Card Payments: <span className={`${getBadgeClass(cardPaymentsStatus)} ml-2`}>{cardPaymentsStatus}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap w-2/3">
            Indicates if your account can collect payments from users. This is *NOT* required, as LSN collects payments for you.
          </p>
        </div> */}

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
        {/* <div>
          <button
            className="btn btn-info mt-4"
            onClick={() => setShowDetails((prev) => !prev)}
          >
            {showDetails ? "Hide Additional Details" : "Show Additional Details"}
          </button>
        </div> */}

        {/* Toggle Button with State Management */}
        <div>
          {requirementsDetails.detailsSubmitted === NOT_FOUND ? (
                        <Button
              variant="filled"
              className="mt-4 cursor-not-allowed bg-red-500"
              disabled
            >
              ⚠️ Error: Required Details Not Found
            </Button>
          ) : requirementsDetails.detailsSubmitted === 'loading' ? (
                        <Button
              variant="filled"
              className="mt-4 cursor-progress bg-blue-400"
              disabled
            >
              <span className="loading loading-spinner"></span>
              Processing Details...
            </Button>
          ) : (
                        <Button
              variant="filled"
              className={`mt-4 ${requirementsDetails.detailsSubmitted ? 'bg-green-500' : 'bg-yellow-500'}`}
              onClick={() => {
                if (requirementsDetails.detailsSubmitted === true) {
                  setShowDetails(false);
                  setShowStripeDashboard((prev) => !prev);
                } else if (requirementsDetails.detailsSubmitted === false) {
                  setShowDetails((prev) => !prev);
                  setShowStripeDashboard(false);
                }
              }}
            >
              {requirementsDetails.detailsSubmitted
                ? (showStripeDashboard ? "Hide Dashboard" : "Show Dashboard")
                : (showDetails ? "Hide Details" : "Show Details")
              }
            </Button>
          )}
        </div>

        {/* Additional Details Section */}
        {showDetails && (
          <div className="mt-6 space-y-6">

            {/* Currently Due (Array<string>) */}
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                  Currently Due:{" "}
                  <span className={`${currentlyDueBadge.badgeClass} ml-2 mt-2`}>
                    {currentlyDueBadge.badgeLabel !== null ? (
                      <p>{currentlyDueBadge.badgeLabel}</p>
                    ) : (
                      <CollapsibleToggle
                        show={showCurrentlyDue}
                        onClick={() => setShowCurrentlyDue(!showCurrentlyDue)}
                        labelShow="Show Currently Due"
                        labelHide="Hide Currently Due"
                      />
                    )}
                  </span>
                </h3>
              </div>
              {requirementsDetails.currentlyDue !== NOT_FOUND &&
                requirementsDetails.currentlyDue != null &&
                Array.isArray(requirementsDetails.currentlyDue) &&
                requirementsDetails.currentlyDue.length > 0 &&
                showCurrentlyDue && (
                  <div className="mt-4">
                    {requirementsDetails.currentlyDue.map((field, index) => (
                      <p key={index} className="mb-1">
                        {getVerificationFieldDescription(field)}
                      </p>
                    ))}
                  </div>
                )
              }
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields currently due for submission.
              </p>
            </div>

            {/* Alternatives (Array<StripeConnectApplicationAlternative>) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Alternatives:{" "}
                <span className={`${alternativesBadge.badgeClass} ml-2`}>
                  {alternativesBadge.badgeLabel !== null ? (
                    <p>{alternativesBadge.badgeLabel}</p>
                  ) : (
                    <CollapsibleToggle
                      show={showAlternatives}
                      onClick={() => setShowAlternatives(!showAlternatives)}
                      labelShow="Show Alternatives"
                      labelHide="Hide Alternatives"
                    />
                  )}
                </span>
              </h3>
              {requirementsDetails.currentlyDue !== NOT_FOUND &&
                requirementsDetails.currentlyDue != null &&
                Array.isArray(requirementsDetails.currentlyDue) &&
                requirementsDetails.currentlyDue.length > 0 &&
                requirementsDetails.alternatives !== NOT_FOUND &&
                requirementsDetails.alternatives != null &&
                Array.isArray(requirementsDetails.alternatives) &&
                requirementsDetails.alternatives.length > 0 &&
                showAlternatives && (
                  <div className="mt-4">
                    {requirementsDetails.alternatives.map((alt, index) => (
                      <p key={index} className="mb-1">
                        {typeof alt === "string" ? alt : JSON.stringify(alt)}
                      </p>
                    ))}
                  </div>
                )}
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
                <span className={`${currentDeadlineBadge.badgeClass} ml-2`}>
                  <p>{currentDeadlineBadge.badgeLabel}</p>
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Deadline for current requirements (timestamp).
              </p>
            </div>

            {/* Past Due */}
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                  Past Due:{" "}
                  <span className={`${pastDueBadge.badgeClass} ml-2 mt-2`}>
                    {pastDueBadge.badgeLabel !== null ? (
                      <p>{pastDueBadge.badgeLabel}</p>
                    ) : (
                      <CollapsibleToggle
                        show={showPastDue}
                        onClick={() => setShowPastDue(!showPastDue)}
                        labelShow="Show Past Due"
                        labelHide="Hide Past Due"
                      />
                    )}
                  </span>
                </h3>
              </div>
              {requirementsDetails.pastDue !== NOT_FOUND &&
                requirementsDetails.pastDue != null &&
                Array.isArray(requirementsDetails.pastDue) &&
                requirementsDetails.pastDue.length > 0 &&
                showPastDue && (
                  <div className="mt-4">
                    {requirementsDetails.pastDue.map((field, index) => (
                      <p key={index} className="mb-1">
                        {getVerificationFieldDescription(field)}
                      </p>
                    ))}
                  </div>
                )}
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields that haven't been submitted by the deadline.
              </p>
            </div>

            {/* Pending Verification (Array<string>) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Pending Verification:{" "}
                <span className={`${pendingVerificationBadge.badgeClass} ml-2`}>
                  {pendingVerificationBadge.badgeLabel !== null ? (
                    <p>{pendingVerificationBadge.badgeLabel}</p>
                  ) : (
                                        <Button variant="ghost" onClick={() => setShowPendingVerification(!showPendingVerification)}>
                      <p>{showPendingVerification ? "Hide Pending" : "Show Pending"}</p>
                    </Button>
                  )}
                </span>
              </h3>
              {requirementsDetails.pendingVerification !== NOT_FOUND &&
                requirementsDetails.pendingVerification != null &&
                Array.isArray(requirementsDetails.pendingVerification) &&
                requirementsDetails.pendingVerification.length > 0 &&
                showPendingVerification && (
                  <div className="mt-4">
                    {requirementsDetails.pendingVerification.map((field, index) => (
                      <p key={index} className="mb-1">
                        {field}
                      </p>
                    ))}
                  </div>
                )}
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Fields pending verification.
              </p>
            </div>

            {/* Errors (Array<StripeConnectApplicationError>) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Errors:{" "}
                <span className={`${errorsBadge.badgeClass} ml-2`}>
                  <p>{errorsBadge.badgeLabel}</p>
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
                <span className={`${disabledReasonBadge.badgeClass} ml-2`}>
                  {disabledReasonBadge.badgeLabel !== null ? (
                    <p>{disabledReasonBadge.badgeLabel}</p>
                  ) : (
                    // <button onClick={() => setShowDisabledReason(!showDisabledReason)}>
                    //   <p>{showDisabledReason ? "Hide Reason" : "Show Reason"}</p>
                    // </button>
                    <CollapsibleToggle
                      show={showDisabledReason}
                      onClick={() => setShowDisabledReason(!showDisabledReason)}
                      labelShow="Show Disabled Reason"
                      labelHide="Hide Disabled Reason"
                    />
                  )}
                </span>
              </h3>
              {requirementsDetails.disabledReason !== NOT_FOUND &&
                requirementsDetails.disabledReason != null &&
                showDisabledReason && (
                  <div className="mt-4">
                    <p>{getDisabledReasonLookup(requirementsDetails.disabledReason)}</p>
                  </div>
                )}
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Reason for disablement of account, if any.
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
                <span className={`${BadgeUtils.getDetailsSubmittedBadge(requirementsDetails.detailsSubmitted).badgeClass} ml-2`}>
                  {BadgeUtils.getDetailsSubmittedBadge(requirementsDetails.detailsSubmitted).badgeLabel}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                Whether the initial onboarding details have been submitted.
              </p>
            </div>

            {/* Account Type (enum) */}
            <div className="text-sm">
              <h3 className="text-lg font-semibold mb-2 text-white capitalize">
                Account Type:{" "}
                <span className={`${BadgeUtils.getAccountTypeBadge(requirementsDetails.accountType).badgeClass} ml-2`}>
                  {BadgeUtils.getAccountTypeBadge(requirementsDetails.accountType).badgeLabel}
                </span>
              </h3>
              <hr className="border-t border-gray-300 w-2/3 my-2" />
              <p className="text-gray-400 whitespace-pre-wrap w-2/3">
                The type of Stripe Connect account.
              </p>
            </div>
          </div>
        )}
        {/* Stripe Dashboard Section */}

        {stripeConnectInstance.status === 'ready' &&
        requirementsDetails.detailsSubmitted &&
        showStripeDashboard && (
          <>
            <ConnectComponentsProvider connectInstance={stripeConnectInstance.instance}>
              <ConnectNotificationBanner />
              <ConnectBalances />
              <ConnectPayments />
              <ConnectPayouts />
              <ConnectAccountManagement />
              <ConnectDocuments />
              <ConnectTaxRegistrations />
              <ConnectTaxSettings />
            </ConnectComponentsProvider>
          </>
        )}
      </div>
    </>
  );
}
