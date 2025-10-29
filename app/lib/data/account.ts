/**
 * Server-side data fetching for account page
 * All functions run on the server and return data for Server Components
 */

import { sql } from "@vercel/postgres";
import Stripe from "stripe";
import { convertSQLEventToEvent } from "@/app/lib/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: "2025-09-30.clover",
});

// Main function to fetch all account data in parallel
export async function getAccountData(userId: string) {
	const [
		user,
		verificationStatus,
		username,
		events,
		registrations,
		referralStats,
		forumPosts,
		stripeStatus,
		accountFields,
		predefinedTags,
	] = await Promise.all([
		getUserBasicInfo(userId),
		getVerificationStatus(userId),
		getUsername(userId),
		getUserEvents(userId),
		getUserRegistrations(userId),
		getReferralStats(userId),
		getForumPosts(userId),
		getStripeAccountStatus(userId),
		getAccountFields(userId),
		getPredefinedTags(),
	]);

	return {
		user,
		verificationStatus,
		username,
		events,
		registrations,
		referralStats,
		forumPosts,
		stripeStatus,
		accountFields,
		predefinedTags,
	};
}

async function getUserBasicInfo(userId: string): Promise<{
	id: string;
	name: string;
	email: string;
	role: string;
	verified_university?: string;
} | null> {
	const result = await sql`
    SELECT id, name, email, role, verified_university
    FROM users
    WHERE id = ${userId}
  `;
	const row = result.rows[0];
	if (!row) return null;

	return {
		id: row.id as string,
		name: row.name as string,
		email: row.email as string,
		role: row.role as string,
		verified_university: row.verified_university as string | undefined,
	};
}

async function getVerificationStatus(userId: string): Promise<{
	emailVerified: boolean;
	universityEmail?: string;
	universityEmailVerified: boolean;
	verifiedUniversity?: string;
	accountType?: string;
} | null> {
	const result = await sql`
    SELECT
      emailverified,
      university_email,
      university_email_verified,
      verified_university,
      account_type
    FROM users
    WHERE id = ${userId}
  `;
	const row = result.rows[0];
	if (!row) return null;

	return {
		emailVerified: row.emailverified as boolean,
		universityEmail: row.university_email as string | undefined,
		universityEmailVerified: row.university_email_verified as boolean,
		verifiedUniversity: row.verified_university as string | undefined,
		accountType: row.account_type as string | undefined,
	};
}

async function getUsername(userId: string) {
	const result = await sql`
    SELECT username
    FROM usernames
    WHERE user_id = ${userId}
  `;
	return result.rows[0]?.username || null;
}

async function getUserEvents(userId: string) {
	// Just select all columns like the existing API does
	const result = await sql`
    SELECT * FROM events
    WHERE organiser_uid = ${userId}
    AND (is_deleted IS NULL OR is_deleted = false)
    ORDER BY COALESCE(end_datetime, start_datetime, make_timestamp(year, month, day,
      EXTRACT(hour FROM start_time::time)::int,
      EXTRACT(minute FROM start_time::time)::int, 0)) DESC
  `;

	// Transform SQL rows to Event objects (adds date field and other transformations)
	return result.rows.map(convertSQLEventToEvent);
}

async function getUserRegistrations(userId: string) {
	const result = await sql`
    SELECT e.*
    FROM events e
    INNER JOIN event_registrations er ON e.id = er.event_id
    WHERE er.user_id = ${userId}
    AND (e.is_deleted IS NULL OR e.is_deleted = false)
    ORDER BY COALESCE(e.start_datetime, make_timestamp(e.year, e.month, e.day, 0, 0, 0)) ASC
  `;

	// Transform SQL rows to Event objects (adds date field and other transformations)
	return result.rows.map(convertSQLEventToEvent);
}

async function getReferralStats(userId: string) {
	const statsResult = await sql`
    SELECT
      COUNT(*) as total_referrals,
      COUNT(CASE WHEN referred_user_id IS NOT NULL THEN 1 END) as successful_referrals,
      COUNT(CASE WHEN referred_user_id IS NOT NULL THEN 1 END) as completed_registrations
    FROM referrals
    WHERE referrer_id = ${userId}
  `;

	const recentResult = await sql`
    SELECT
      r.referral_code,
      r.created_at,
      r.registered_at,
      u.name as referred_user_name,
      u.email as referred_user_email
    FROM referrals r
    LEFT JOIN users u ON r.referred_user_id = u.id
    WHERE r.referrer_id = ${userId}
    ORDER BY r.created_at DESC
    LIMIT 10
  `;

	const stats = statsResult.rows[0];

	return {
		stats: {
			totalReferrals: parseInt(stats.total_referrals || '0'),
			successfulReferrals: parseInt(stats.successful_referrals || '0'),
			completedRegistrations: parseInt(stats.completed_registrations || '0'),
		},
		recentReferrals: recentResult.rows.map(row => ({
			code: row.referral_code,
			createdAt: row.created_at,
			registeredAt: row.registered_at,
			referredUser: row.referred_user_name ? {
				name: row.referred_user_name,
				email: row.referred_user_email,
			} : null,
		})),
	};
}

async function getForumPosts(userId: string) {
	const threadsResult = await sql`
    SELECT
      t.id,
      t.title,
      t.content,
      t.upvotes,
      t.downvotes,
      t.created_at,
      t.updated_at,
      u.username,
      (SELECT COUNT(*) FROM comments WHERE thread_id = t.id) as reply_count,
      (t.upvotes - t.downvotes) as score,
      ARRAY(
        SELECT ft.name
        FROM thread_tags tt
        JOIN forum_tags ft ON tt.forum_tag_id = ft.id
        WHERE tt.thread_id = t.id
      ) as tags
    FROM threads t
    JOIN usernames u ON t.author_id = u.user_id
    WHERE t.author_id = ${userId}
    ORDER BY t.created_at DESC
  `;

	const repliesResult = await sql`
    SELECT
      c.id,
      c.content,
      c.thread_id,
      c.parent_id as parent_reply_id,
      c.created_at,
      c.updated_at,
      t.title as thread_title,
      u.username,
      c.upvotes as like_count,
      EXISTS(SELECT 1 FROM comments_votes WHERE comment_id = c.id AND user_id = ${userId} AND vote_type = 'up') as is_liked
    FROM comments c
    JOIN threads t ON c.thread_id = t.id
    JOIN usernames u ON c.author_id = u.user_id
    WHERE c.author_id = ${userId}
    ORDER BY c.created_at DESC
  `;

	return {
		threads: threadsResult.rows.map(t => ({
			...t,
			reply_count: parseInt(t.reply_count || '0'),
			tags: t.tags || [],
		})),
		replies: repliesResult.rows.map(r => ({
			...r,
			like_count: parseInt(r.like_count || '0'),
			is_liked: Boolean(r.is_liked),
		})),
	};
}

async function getStripeAccountStatus(userId: string) {
	const result = await sql`
    SELECT stripe_connect_account_id, role
    FROM users
    WHERE id = ${userId}
  `;

	const user = result.rows[0];
	const stripeAccountId = user?.stripe_connect_account_id;

	// Only fetch Stripe data for organizers/companies
	if (!stripeAccountId || !user || (user.role !== 'organiser' && user.role !== 'company')) {
		return {
			hasAccount: false,
			accountId: null,
			status: null,
		};
	}

	try {
		const account = await stripe.accounts.retrieve(stripeAccountId);

		return {
			hasAccount: true,
			accountId: stripeAccountId,
			status: {
				detailsSubmitted: account.details_submitted || false,
				chargesEnabled: account.charges_enabled || false,
				payoutsEnabled: account.payouts_enabled || false,
				onboardingComplete: (account.details_submitted && account.charges_enabled) || false,
				email: account.email || undefined,
				country: account.country || undefined,
				defaultCurrency: account.default_currency || undefined,
			},
		};
	} catch (error) {
		console.error('Error fetching Stripe account:', error);
		return {
			hasAccount: true,
			accountId: stripeAccountId,
			status: null,
			error: 'Failed to fetch Stripe account status',
		};
	}
}

async function getAccountFields(userId: string) {
	const result = await sql`
    SELECT logo_url, description, website, tags
    FROM society_information
    WHERE user_id = ${userId}
    LIMIT 1
  `;

	const data = result.rows[0];
	return {
		logo_url: data?.logo_url || null,
		description: data?.description || '',
		website: data?.website || '',
		tags: data?.tags || [],
	};
}

async function getPredefinedTags(): Promise<Array<{ value: number; label: string }>> {
	const result = await sql`
    SELECT value, label
    FROM tags
    ORDER BY label ASC
  `;

	return result.rows.map(row => ({
		value: row.value as number,
		label: row.label as string,
	}));
}
