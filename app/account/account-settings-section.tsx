"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/button';
import StripeConnectStatus from '../components/account/stripe-connect-status';
import ForgottenPasswordModal from '../components/login/reset-password-modal';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

interface StripeAccountStatus {
  hasAccount: boolean;
  accountId: string | null;
  status: {
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    onboardingComplete: boolean;
    email?: string;
    country?: string;
    defaultCurrency?: string;
  };
}

interface Props {
  stripeStatus: StripeAccountStatus | null;
  userRole: string;
  userId?: string;
}

export default function AccountSettingsSection({ stripeStatus, userRole, userId }: Props) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [donationsEnabled, setDonationsEnabled] = useState(false);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donationsUpdating, setDonationsUpdating] = useState(false);

  // Stripe Connect is available for all users (not just organisers/companies)
  // Users can create events and sell tickets too!
  const canUseStripe = userRole === 'organiser' || userRole === 'company' || userRole === 'user';

  // Only organisers can enable donations
  const canEnableDonations = userRole === 'organiser';

  // Fetch donation settings on mount
  useEffect(() => {
    if (canEnableDonations && userId) {
      const fetchDonationSettings = async () => {
        try {
          const response = await fetch(`/api/society/donation-settings?organiser_uid=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setDonationsEnabled(data.allow_donations ?? false);
          }
        } catch (error) {
          console.error('Failed to fetch donation settings:', error);
        } finally {
          setDonationsLoading(false);
        }
      };
      fetchDonationSettings();
    } else {
      setDonationsLoading(false);
    }
  }, [canEnableDonations, userId]);

  const handleDonationToggle = async () => {
    if (donationsUpdating) return;
    setDonationsUpdating(true);

    try {
      const response = await fetch('/api/society/donation-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allow_donations: !donationsEnabled })
      });

      if (response.ok) {
        setDonationsEnabled(!donationsEnabled);
        toast.success(donationsEnabled ? 'Donations disabled' : 'Donations enabled');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update donation settings');
      }
    } catch (error) {
      console.error('Failed to update donation settings:', error);
      toast.error('Failed to update donation settings');
    } finally {
      setDonationsUpdating(false);
    }
  };

  return (
    <section id="account" className="scroll-mt-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Account settings</h2>
      <p className="text-gray-300 mb-4 md:mb-8">Manage your account security and preferences</p>

      <div className="space-y-4 md:space-y-6">
        {/* Stripe Connect for payment processing */}
        {canUseStripe && (
          <div data-stripe-settings>
            <StripeConnectStatus initialStatus={stripeStatus} userRole={userRole} />
          </div>
        )}

        {/* Donation Settings - Only for organisers with Stripe enabled */}
        {canEnableDonations && stripeStatus?.status?.chargesEnabled && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-pink-500/20 rounded-lg">
                  <Heart className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Accept Donations</h3>
                  <p className="text-gray-300 text-sm">
                    Allow attendees to add optional donations when purchasing tickets.
                    100% of donations go directly to your society with no platform fees.
                  </p>
                </div>
              </div>
              <button
                onClick={handleDonationToggle}
                disabled={donationsLoading || donationsUpdating}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                  donationsEnabled ? 'bg-pink-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    donationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {donationsEnabled && (
              <div className="mt-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                <p className="text-pink-300 text-sm">
                  Donations are now enabled. Attendees will see donation options (£1, £3, £5, or custom)
                  when purchasing tickets for your events.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
          <p className="text-gray-300 mb-4">Update your password to keep your account secure</p>
          <Button
            variant="ghost"
            className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-sm md:text-base"
            onClick={() => setShowPasswordModal(true)}
          >
            Reset Your Password
          </Button>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <ForgottenPasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </section>
  );
}
