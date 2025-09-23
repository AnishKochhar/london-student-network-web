import { sql } from "@vercel/postgres";

/**
 * Validates username format and length based on user role
 */
export function validateUsername(username: string, userRole: string = 'user'): { valid: boolean; error?: string } {
	if (!username) {
		return { valid: false, error: "Username is required" };
	}

	if (username.length < 3) {
		return { valid: false, error: "Username must be at least 3 characters long" };
	}

	// Different length limits based on user role
	const maxLength = userRole === 'user' ? 30 : 100;
	if (username.length > maxLength) {
		return { valid: false, error: `Username must be no more than ${maxLength} characters long` };
	}

	// Different format validation based on user role
	if (userRole === 'user') {
		// Only allow alphanumeric characters, underscores, and hyphens for users
		const validFormat = /^[a-zA-Z0-9_-]+$/.test(username);
		if (!validFormat) {
			return { valid: false, error: "Username can only contain letters, numbers, underscores, and hyphens" };
		}

		// Don't allow usernames that start or end with underscore or hyphen
		if (username.startsWith('_') || username.startsWith('-') || username.endsWith('_') || username.endsWith('-')) {
			return { valid: false, error: "Username cannot start or end with underscore or hyphen" };
		}
	} else {
		// For organisers and companies, allow spaces and more characters
		const validFormat = /^[a-zA-Z0-9 _.-]+$/.test(username);
		if (!validFormat) {
			return { valid: false, error: "Username can only contain letters, numbers, spaces, underscores, periods, and hyphens" };
		}

		// Don't allow leading or trailing spaces
		if (username !== username.trim()) {
			return { valid: false, error: "Username cannot start or end with spaces" };
		}
	}

	// Prevent reserved usernames (case insensitive)
	const reserved = ['admin', 'administrator', 'mod', 'moderator', 'user', 'guest', 'system', 'support', 'help', 'api', 'www', 'mail', 'email'];
	if (reserved.includes(username.toLowerCase())) {
		return { valid: false, error: "This username is reserved" };
	}

	return { valid: true };
}

/**
 * Checks if a username is available in the database
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
	try {
		const result = await sql`
            SELECT COUNT(*) as count
            FROM usernames
            WHERE LOWER(username) = LOWER(${username})
        `;

		return parseInt(result.rows[0].count) === 0;
	} catch (error) {
		console.error("Error checking username availability:", error);
		throw new Error("Failed to check username availability");
	}
}

/**
 * Generates username suggestions based on a user's full name and role
 */
export function generateUsernameSuggestions(fullName: string, userRole: string = 'user'): string[] {
	if (!fullName) return [];

	// Clean and split the name
	const cleanName = fullName.replace(/[^a-zA-Z\s]/g, '').trim();
	const parts = cleanName.split(/\s+/).filter(part => part.length > 0);

	if (parts.length === 0) return [];

	const suggestions: string[] = [];

	// Get first and last name
	const firstName = parts[0];
	const lastName = parts[parts.length - 1];

	// Strategy 1: FirstLast
	if (firstName && lastName) {
		suggestions.push(`${firstName}${lastName}`);
	}

	// Strategy 2: FirstL (first name + last initial)
	if (firstName && lastName) {
		suggestions.push(`${firstName}${lastName.charAt(0)}`);
	}

	// Strategy 3: First_Last
	if (firstName && lastName) {
		suggestions.push(`${firstName}_${lastName}`);
	}

	// Strategy 4: First-Last
	if (firstName && lastName) {
		suggestions.push(`${firstName}-${lastName}`);
	}

	// Strategy 5: FirstLast with numbers
	if (firstName && lastName) {
		for (let i = 1; i <= 99; i++) {
			suggestions.push(`${firstName}${lastName}${i}`);
		}
	}

	// Strategy 6: Just first name with numbers
	if (firstName) {
		for (let i = 1; i <= 99; i++) {
			suggestions.push(`${firstName}${i}`);
		}
	}

	// Strategy 7: Initials with numbers
	if (parts.length >= 2) {
		const initials = parts.map(part => part.charAt(0)).join('');
		for (let i = 1; i <= 99; i++) {
			suggestions.push(`${initials}${i}`);
		}
	}

	// Remove duplicates and ensure all suggestions are valid
	const uniqueSuggestions = [...new Set(suggestions)];

	return uniqueSuggestions
		.filter(suggestion => validateUsername(suggestion, userRole).valid)
		.slice(0, 10); // Return max 10 suggestions
}

/**
 * Gets available username suggestions by checking against database
 */
export async function getAvailableUsernameSuggestions(fullName: string, userRole: string = 'user', limit: number = 5): Promise<string[]> {
	const suggestions = generateUsernameSuggestions(fullName, userRole);
	const availableSuggestions: string[] = [];

	for (const suggestion of suggestions) {
		if (availableSuggestions.length >= limit) break;

		try {
			const isAvailable = await isUsernameAvailable(suggestion);
			if (isAvailable) {
				availableSuggestions.push(suggestion);
			}
		} catch (error) {
			console.error(`Error checking availability for ${suggestion}:`, error);
			continue;
		}
	}

	return availableSuggestions;
}