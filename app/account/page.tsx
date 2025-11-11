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
import AccountSettingsSection from './account-settings-section';
import AccountLayoutClient from './account-layout-client';
import ProfileSection from './profile-section';

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
    <AccountLayoutClient userName={session.user.name || ''} userEmail={session.user.email || ''}>
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

      <section id="profiles" className="scroll-mt-8">
        <ProfileSection
          user={accountData.user}
        />
      </section>

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
          {/* @ts-expect-error - Forum posts type mismatch will be fixed in future PR */}
          <UserForumPosts initialPosts={accountData.forumPosts} />
        </div>
      </section>

      {/* Account Settings Section */}
      <AccountSettingsSection
        stripeStatus={accountData.stripeStatus}
        userRole={accountData.user.role}
      />

      {/* Bottom padding for scroll */}
      <div className="h-32"></div>
      </div>
    </AccountLayoutClient>
  );
}
