/**
 * Account Page - Server Component
 * Fetches all data on the server and passes to client components
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAccountData } from '@/app/lib/data/account';
import PersonalInfoSection from './personal-info-section';
import UserEventsList from '../components/account/user-events-list';
import UserRegistrations from '../components/account/user-registrations';
import UserReferrals from '../components/account/user-referrals';
import UserForumPosts from '../components/account/user-forum-posts';
import StripeConnectStatus from '../components/account/stripe-connect-status';
import { Button } from '@/app/components/button';

// Force dynamic rendering (no caching for user-specific pages)
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  // 1. Server-side authentication
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // 2. Fetch all data in parallel on the server
  const accountData = await getAccountData(session.user.id);

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-16">
      {/* Personal Information Section */}
      <PersonalInfoSection
        user={accountData.user}
        verificationStatus={accountData.verificationStatus}
        username={accountData.username}
        stripeStatus={accountData.stripeStatus}
        accountFields={accountData.accountFields}
        predefinedTags={accountData.predefinedTags}
      />

      {/* Your Events Section */}
      <section id="events" className="scroll-mt-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Your events</h2>
        <p className="text-gray-300 mb-4 md:mb-8">View and manage events you&apos;ve created or are organising</p>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <UserEventsList
            user_id={session.user.id}
            editEvent={true}
            initialEvents={accountData.events}
          />
        </div>
      </section>

      {/* Your Registrations Section */}
      <section id="registrations" className="scroll-mt-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Your registrations</h2>
        <p className="text-gray-300 mb-4 md:mb-8">Events you&apos;ve signed up for</p>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <UserRegistrations initialRegistrations={accountData.registrations} />
        </div>
      </section>

      {/* Your Referrals Section */}
      <section id="referrals" className="scroll-mt-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Your referrals</h2>
        <p className="text-gray-300 mb-4 md:mb-8">Track your referrals and progress towards rewards</p>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <UserReferrals initialReferralData={accountData.referralStats} />
        </div>
      </section>

      {/* Forum Posts Section */}
      <section id="forum" className="scroll-mt-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Forum activity</h2>
        <p className="text-gray-300 mb-4 md:mb-8">View your forum threads and replies</p>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <UserForumPosts initialPosts={accountData.forumPosts} />
        </div>
      </section>

      {/* Account Settings Section */}
      <section id="account" className="scroll-mt-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Account settings</h2>
        <p className="text-gray-300 mb-4 md:mb-8">Manage your account security and preferences</p>

        <div className="space-y-4 md:space-y-6">
          {/* Stripe Connect for organizers/companies */}
          {(session?.user?.role === 'organiser' || session?.user?.role === 'company') && (
            <div data-stripe-settings>
              <StripeConnectStatus initialStatus={accountData.stripeStatus} />
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
            <p className="text-gray-300 mb-4">Update your password to keep your account secure</p>
            <Button
              variant="ghost"
              className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-sm md:text-base"
              onClick={() => {}} // Will be handled by client component
            >
              Reset Your Password
            </Button>
          </div>
        </div>
      </section>

      {/* Bottom padding for scroll */}
      <div className="h-32"></div>
    </div>
  );
}
