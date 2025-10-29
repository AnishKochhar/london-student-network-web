/**
 * Server-side data fetching for account page
 * All functions run on the server and return data for Server Components
 */

import { sql } from "@vercel/postgres";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-10-28.acacia",
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

async function getUserBasicInfo(userId: string) {
  const result = await sql`
    SELECT id, name, email, role, verified_university
    FROM users
    WHERE id = ${userId}
  `;
  return result.rows[0] || null;
}

async function getVerificationStatus(userId: string) {
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
  return result.rows[0] || null;
}

async function getUsername(userId: string) {
  const result = await sql`
    SELECT username
    FROM users
    WHERE id = ${userId}
  `;
  return result.rows[0]?.username || null;
}

async function getUserEvents(userId: string) {
  const result = await sql`
    SELECT
      id,
      name,
      description,
      location,
      date,
      start_datetime,
      end_datetime,
      organiser_id,
      capacity,
      image_url,
      is_hidden,
      visibility,
      created_at,
      has_paid_tickets,
      (SELECT COUNT(*) FROM registrations WHERE event_id = events.id) as registration_count
    FROM events
    WHERE organiser_id = ${userId}
    ORDER BY start_datetime DESC
  `;

  return result.rows.map(event => ({
    ...event,
    registration_count: parseInt(event.registration_count || '0'),
  }));
}

async function getUserRegistrations(userId: string) {
  const result = await sql`
    SELECT
      e.id,
      e.name,
      e.description,
      e.location,
      e.date,
      e.start_datetime,
      e.end_datetime,
      e.organiser_id,
      e.capacity,
      e.image_url,
      e.has_paid_tickets,
      r.created_at as registered_at
    FROM events e
    INNER JOIN registrations r ON e.id = r.event_id
    WHERE r.user_id = ${userId}
    ORDER BY e.start_datetime DESC
  `;

  return result.rows;
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
      r.code,
      r.created_at,
      r.registered_at,
      u.name as referred_user_name,
      u.email as referred_user_email
    FROM referrals r
    LEFT JOIN users u ON r.referred_user_id = u.id
    WHERE r.referrer_id = ${userId}
    ORDER BY COALESCE(r.registered_at, r.created_at) DESC
    LIMIT 10
  `;

  const stats = statsResult.rows[0];

  return {
    stats: {
      totalReferrals: parseInt(stats.total_referrals || '0'),
      successfulReferrals: parseInt(stats.successful_referrals || '0'),
      completedRegistrations: parseInt(stats.completed_registrations || '0'),
    },
    recentReferrals: recentResult.rows.map(r => ({
      code: r.code,
      createdAt: r.created_at?.toISOString() || '',
      registeredAt: r.registered_at?.toISOString() || null,
      referredUser: r.referred_user_name ? {
        name: r.referred_user_name,
        email: r.referred_user_email,
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
      t.tags,
      t.upvotes,
      t.downvotes,
      t.score,
      t.created_at,
      t.updated_at,
      u.username,
      (SELECT COUNT(*) FROM replies WHERE thread_id = t.id) as reply_count
    FROM threads t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE t.user_id = ${userId}
    ORDER BY t.created_at DESC
  `;

  const repliesResult = await sql`
    SELECT
      r.id,
      r.content,
      r.thread_id,
      r.parent_reply_id,
      r.created_at,
      r.updated_at,
      t.title as thread_title,
      u.username,
      (SELECT COUNT(*) FROM reply_likes WHERE reply_id = r.id) as like_count,
      EXISTS(SELECT 1 FROM reply_likes WHERE reply_id = r.id AND user_id = ${userId}) as is_liked
    FROM replies r
    INNER JOIN threads t ON r.thread_id = t.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE r.user_id = ${userId}
    ORDER BY r.created_at DESC
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
    SELECT stripe_account_id, role
    FROM users
    WHERE id = ${userId}
  `;

  const user = result.rows[0];
  const stripeAccountId = user?.stripe_account_id;

  // Only fetch Stripe data for organizers/companies
  if (!stripeAccountId || (user.role !== 'organiser' && user.role !== 'company')) {
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
    FROM users
    WHERE id = ${userId}
  `;

  const data = result.rows[0];
  return {
    logo_url: data?.logo_url || null,
    description: data?.description || '',
    website: data?.website || '',
    tags: data?.tags || [],
  };
}

async function getPredefinedTags() {
  const result = await sql`
    SELECT id, name as label, id as value
    FROM tags
    ORDER BY name ASC
  `;

  return result.rows;
}
