import { twMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"
import { v4 as uuidv4 } from 'uuid';

export function formattedWebsite (website: string) { // formats website to include https:// if it doesn't already
    return website.startsWith('http') ? website : `https://${website}`;
};

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeFirst = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

export const FallbackStatistics = {
	total_events: '90',
	total_universities: '20',
	total_societies: '50'
}

export function generateToken(): string {
	const token = uuidv4();

	if (!token) {
		console.error('Failed to generate token');
		throw new Error('Failed to generate token');
	}

	return token;
}
