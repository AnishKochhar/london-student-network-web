'use client';

import { useEffect, useState } from "react";
import { NOT_FOUND } from "@/app/lib/types/general";

// Define types for statuses
type CardPaymentsStatus = 'loading' | 'inconclusive' | 'active' | 'inactive' | 'pending';
type BankTransferStatus = 'loading' | 'inconclusive' | 'active' | 'inactive' | 'pending'; 
type PayoutsStatus = 'loading' | 'inconclusive' | boolean;
type StripeConnectOnboardingStatus =
  | 'loading'
  | 'inconclusive'
  | 'not started'
  | 'action required'
  | 'under review'
  | 'approved'
  | 'rejected'
  | 'disabled';

interface StripeConnectStatusResponse {
  cardPaymentsCapabilityStatus?: CardPaymentsStatus;
  bankTransferCapabilityStatus?: BankTransferStatus;
  payoutsCapabilityStatus?: PayoutsStatus;
  stripeConnectOnboardingStatus: StripeConnectOnboardingStatus;
}

export default function StripeConnectStatus({ id }: { id: string }) {
  const [cardPaymentsStatus, setCardPaymentsStatus] = useState<CardPaymentsStatus>('loading');
  const [bankTransferCapabilityStatus, setBankTransferCapabilityStatus] = useState<BankTransferStatus>('loading');
  const [payoutsEnabled, setPayoutsEnabled] = useState<PayoutsStatus>('loading');
  const [stripeConnectOnboardingStatus, setStripeConnectOnboardingStatus] = useState<StripeConnectOnboardingStatus>('loading');



  // Fetch account status from backend API on component mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        // Using a query parameter instead of request body with GET
        const res = await fetch('/api/account/stripe-connect/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: id }),
        });
        if (!res.ok) {
          console.error("Failed to fetch status:", res.statusText);
          return;
        }
        const data: StripeConnectStatusResponse = await res.json();
        setCardPaymentsStatus(data?.cardPaymentsCapabilityStatus ?? 'inconclusive');
        setBankTransferCapabilityStatus(data?.bankTransferCapabilityStatus ?? 'inconclusive');
        setPayoutsEnabled(data?.payoutsCapabilityStatus ?? 'inconclusive');
        setStripeConnectOnboardingStatus(data?.stripeConnectOnboardingStatus ?? 'inconclusive');
      } catch (error) { // set to inconclusive, in case the user did not refresh, but api was recalled and failed
        setCardPaymentsStatus('inconclusive');
        setBankTransferCapabilityStatus('inconclusive');
        setPayoutsEnabled('inconclusive');
        setStripeConnectOnboardingStatus('inconclusive');
        console.error("Error fetching Stripe Connect status:", error);
      }
    }
    fetchStatus();
  }, []);

  // Helper: Map a status to a DaisyUI badge class
  // Helper: Map a status to a DaisyUI badge class.
  function getBadgeClass(status: string | boolean | typeof NOT_FOUND | Array<any>): string {
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
          <p className="text-gray-400 whitespace-pre-wrap">
            This must be active to accept card payments from users.
          </p>
        </div>

        {/* Bank Transfers Status */}
        <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Bank Transfers: <span className={`${getBadgeClass(bankTransferCapabilityStatus)} ml-2`}>{bankTransferCapabilityStatus}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap">
            This must be active for LSN to direct payments to your Connected Stripe Express account.
          </p>
        </div>

        {/* Payouts Status */}
        <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Payouts Enabled: <span className={`${getBadgeClass(payoutsEnabled)} ml-2`}>{payoutsEnabled.toString()}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap">
            This is required for you to be able to withdraw funds from your Stripe Express account.
          </p>
        </div>

        {/* Stripe Connect Onboarding Status */}
        <div className="text-sm">
          <h3 className="text-lg font-semibold mb-2 text-white capitalize">
            Stripe Connect Account Status: <span className={`${getBadgeClass(stripeConnectOnboardingStatus)} ml-2`}>{stripeConnectOnboardingStatus}</span>
          </h3>
          <hr className="border-t border-gray-300 w-2/3 my-2" />
          <p className="text-gray-400 whitespace-pre-wrap">
            Click "Edit Account Details" to see more details.
          </p>
        </div>
      </div>
    </>
  );
}
