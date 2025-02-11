import { NextResponse } from "next/server";
import { fetchUserEvents, fetchAccountId } from "@/app/lib/data";
import getStripe from "@/app/lib/utils/stripe";
import { auth } from "@/auth";

const stripe = await getStripe();

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
        { error: "Please login to view this resource" },
        { status: 401 }
      );
    }

    // Get the Stripe account ID for this user.
    const response = await fetchAccountId(user_id);
    if (!response.success) {
      return NextResponse.json(
        { stripeConnectOnboardingStatus: "inconclusive" },
        { status: 500 }
      );
    }
    if (!response.accountId) {
      return NextResponse.json(
        { 
            cardPaymentsCapabilityStatus: 'inactive',
            bankTransferCapabilityStatus: 'inactive',
            payoutsCapabilityStatus: false,
            stripeConnectOnboardingStatus: "not started" 
        },
        { status: 200 }
      );
    }
    const accountId = response.accountId;

    // Retrieve the Stripe account details.
    const stripeAccount = await stripe.accounts.retrieve(accountId);

    // Compute the status for being able to accept card payments (so LSN can charge a user).
    const cardPaymentsCapabilityStatus = stripeAccount.capabilities?.card_payments;

    // Compute the status for bank transfers between stripe connect accounts (so LSN can direct funds to society).
    const bankTransferCapabilityStatus = stripeAccount.capabilities.transfers; 

    // Compute the status of payouts to external/personal banks (so society can withdraw their funds from Stripe).
    const payoutsCapabilityStatus = stripeAccount.payouts_enabled;

    // Determine the Stripe Connect onboarding status.
    let stripeConnectOnboardingStatus:
      | "inconclusive"
      | "not started"
      | "more info required"
      | "under review"
      | "approved"
      | "rejected"
      | "disabled" = "approved";

    if (stripeAccount.requirements.disabled_reason) {
      stripeConnectOnboardingStatus = "disabled";
    } else if (
      stripeAccount.requirements.currently_due &&
      stripeAccount.requirements.currently_due.length > 0
    ) {
      stripeConnectOnboardingStatus = "more info required";
    } else {
      stripeConnectOnboardingStatus = "approved";
    }


    return NextResponse.json(
      {
        cardPaymentsCapabilityStatus,
        bankTransferCapabilityStatus,
        payoutsCapabilityStatus,
        stripeConnectOnboardingStatus,
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
