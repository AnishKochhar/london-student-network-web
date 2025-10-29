"use client";

import { useState } from 'react';
import { Button } from '@/app/components/button';
import StripeConnectStatus from '../components/account/stripe-connect-status';
import ForgottenPasswordModal from '../components/login/reset-password-modal';
import { useSession } from 'next-auth/react';

interface Props {
  stripeStatus: any;
}

export default function AccountSettingsSection({ stripeStatus }: Props) {
  const { data: session } = useSession();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  return (
    <section id="account" className="scroll-mt-8">
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Account settings</h2>
      <p className="text-gray-300 mb-4 md:mb-8">Manage your account security and preferences</p>

      <div className="space-y-4 md:space-y-6">
        {/* Stripe Connect for organizers/companies */}
        {(session?.user?.role === 'organiser' || session?.user?.role === 'company') && (
          <div data-stripe-settings>
            <StripeConnectStatus initialStatus={stripeStatus} />
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
