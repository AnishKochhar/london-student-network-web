import { sql } from '@vercel/postgres';
import { redis } from './config';
import { InsertTokenResult } from './types';

export async function setEmailVerifiedField(email: string, token: string) {
	console.log(`setting email verified for ${email}`);
	try {
		await sql`
			UPDATE users
			SET 
				emailverified = true
			WHERE email = ${email} --- Email is UNIQUE among users table
		`

		// Remove the Redis token entry
		const tokenKey = `verification_token:${token}`;
		await redis.del(tokenKey); // Delete the token from Redis after successful update

		return { success: true };
	} catch (error) {
		console.error('Error updating user password');
		return { success: false, error };
	}
}

export async function insertToken(email: string, token: string, purpose: string, customExpiry: number = 3600): Promise<InsertTokenResult> {
    try {

        let tokenKey: string;
        let emailKey: string;

        switch (purpose) {
            case 'reset':
                tokenKey = `reset_password_token:${token}`;
                emailKey = `reset_password_email:${email}`;
                break;
            case 'verify':
                tokenKey = `verification_token:${token}`;
                emailKey = `verification_email:${email}`;
                break;
            default:
                console.error('Invalid token purpose:', purpose);
                return { success: false };
        }

        // Set the token and email in Redis with a 60-minute expiry (3600 seconds)
        const expiryInSeconds = customExpiry || 3600; // 60 minutes

        // Use a pipeline for atomicity (important!)
        const pipeline = redis.pipeline();
        pipeline.set(tokenKey, email, 'EX', expiryInSeconds); // Maps token to email
        pipeline.set(emailKey, token, 'EX', expiryInSeconds); // Maps email to token

        const results = await pipeline.exec();

        // Check if both SET operations were successful. Pipeline.exec returns an array of results
        // where each result is [error, result]. A null error means success.
        if (results && results.length === 2 && results[0][0] === null && results[1][0] === null) {
            console.log(`Verification token for email ${email} inserted/updated successfully.`);
            return { success: true };
        } else {
            // Handle cases where one or both SET operations failed
            console.error('Failed to set both token and email in Redis:', results);
            return { success: false };
        }

    } catch (error) {
        console.error('Error inserting verification token:', error);
        return { success: false }; // Return false on any error
    }
}

export async function getEmailFromToken(token: string, type: string) { // type is 'verification' or 'reset_password'
	try {

		const tokenKey = `${type}_token:${token}`;
	
		// Fetch the email associated with the token from Redis
		const email = await redis.get(tokenKey);
  
		if (!email) {
			// If no email is found, the token is invalid or expired
			console.log('No email found for the provided token');
			return { success: false, error: 'Invalid or expired token' };
		}
  
		// console.log(`Email ${email} found for token ${token}`);
		return { success: true, email };
	} catch (error) {
		console.error('Error fetching email for token:', error);
		return { success: false, error };
	}
}

export async function validateToken(token: string, type: string): Promise<string> { // type is 'verification' or 'reset_password'
	try {
		console.log('function validateToken invoked');
		const tokenKey = `${type}_token:${token}`;
		
		// Check if the token exists in Redis
		const tokenExpiry = await redis.get(tokenKey);
		
		if (!tokenExpiry) {
			return 'invalid'; 
		}
		
		// Compare the token's expiry time with the current time
		const currentTime = new Date();
		const expiryTime = new Date(tokenExpiry);
		
		if (expiryTime < currentTime) {
			await redis.del(tokenKey);
			return 'expired';
		}
		
		return 'valid'; 
	} catch (error) {
		console.error('Error checking password reset token:', error);
		return 'invalid';
	}
}