/**
 * Account Storage Utility
 * Manages recent account list in localStorage for account switching
 */

export interface SavedAccount {
    email: string;
    name: string;
    lastUsed: number;
}

const STORAGE_KEY = 'lsn_recent_accounts';
const MAX_ACCOUNTS = 5;

/**
 * Get all saved accounts, sorted by most recently used
 */
export function getSavedAccounts(): SavedAccount[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const accounts: SavedAccount[] = JSON.parse(stored);
        return accounts.sort((a, b) => b.lastUsed - a.lastUsed);
    } catch (error) {
        console.error('Error reading saved accounts:', error);
        return [];
    }
}

/**
 * Save an account to the recent list
 */
export function saveAccount(email: string, name: string): void {
    if (typeof window === 'undefined') return;

    try {
        let accounts = getSavedAccounts();

        // Remove existing entry for this email if it exists
        accounts = accounts.filter(acc => acc.email !== email);

        // Add new entry at the top
        accounts.unshift({
            email,
            name,
            lastUsed: Date.now()
        });

        // Keep only the most recent MAX_ACCOUNTS
        accounts = accounts.slice(0, MAX_ACCOUNTS);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
        console.error('Error saving account:', error);
    }
}

/**
 * Remove an account from the list
 */
export function removeAccount(email: string): void {
    if (typeof window === 'undefined') return;

    try {
        const accounts = getSavedAccounts();
        const filtered = accounts.filter(acc => acc.email !== email);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
        console.error('Error removing account:', error);
    }
}

/**
 * Get initials from name for avatar
 */
export function getInitials(name: string): string {
    if (!name) return '?';

    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}
