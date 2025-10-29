'use server';

/**
 * Server Actions for account page mutations
 * These replace the old API routes for better performance and simpler code
 */

import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateName(newName: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!newName.trim()) {
    return { success: false, error: 'Name cannot be empty' };
  }

  try {
    await sql`
      UPDATE users
      SET name = ${newName.trim()}
      WHERE id = ${session.user.id}
    `;

    // Note: JWT will still have old name until user signs in again
    // We handle this by forcing a logout in the client
    revalidatePath('/account');
    return { success: true };
  } catch (error) {
    console.error('Error updating name:', error);
    return { success: false, error: 'Failed to update name' };
  }
}

export async function resendPrimaryVerificationEmail() {
  const session = await auth();

  if (!session?.user?.email) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { sendEmailVerificationEmail } = await import('@/app/lib/send-email');
    const { insertToken } = await import('@/app/lib/redis-operations');
    const { generateToken } = await import('@/app/lib/utils');

    const token = generateToken();
    const response = await insertToken(session.user.email, token, 'verify');

    if (!response.success) {
      throw new Error('Failed to generate verification token');
    }

    await sendEmailVerificationEmail(session.user.email, token);

    return { success: true };
  } catch (error) {
    console.error('Error resending verification email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

export async function resendUniversityVerificationEmail(universityEmail: string) {
  const session = await auth();

  if (!session?.user?.id || !universityEmail) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const { sendUniversityVerificationEmail } = await import('@/app/lib/send-email');
    const {
      extractUniversityFromEmail,
      generateVerificationToken,
      storeUniversityVerificationToken,
    } = await import('@/app/lib/university-verification');

    // Validate university email domain
    const universityResult = await extractUniversityFromEmail(universityEmail);

    if (!universityResult.success || !universityResult.universityName) {
      return {
        success: false,
        error: universityResult.error || 'Invalid university email domain',
      };
    }

    // Generate and store verification token
    const token = await generateVerificationToken();
    const storeResult = await storeUniversityVerificationToken(
      session.user.id,
      universityEmail,
      token
    );

    if (!storeResult.success) {
      return {
        success: false,
        error: 'Failed to generate verification token',
      };
    }

    // Send verification email
    await sendUniversityVerificationEmail(
      universityEmail,
      token,
      universityResult.universityName
    );

    return { success: true };
  } catch (error) {
    console.error('Error resending university verification email:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

export async function refreshVerificationStatus() {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const result = await sql`
      SELECT
        emailverified,
        university_email,
        university_email_verified,
        verified_university,
        account_type
      FROM users
      WHERE id = ${session.user.id}
    `;

    revalidatePath('/account');
    return {
      success: true,
      data: result.rows[0] || null,
    };
  } catch (error) {
    console.error('Error refreshing verification status:', error);
    return { success: false, error: 'Failed to refresh status' };
  }
}
