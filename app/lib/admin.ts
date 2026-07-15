/**
 * The LSN admin / system user id.
 *
 * Used to attribute system-created events and to suppress redundant admin
 * notification emails. Previously hardcoded as a literal in 8+ files; it now
 * lives here so there is a single place to change it. Override via the
 * ADMIN_USER_ID environment variable; the default preserves existing
 * behaviour.
 *
 * Note: this is an identifier, not a secret. In client components the env var
 * is unavailable, so the default is always used there.
 */
export const ADMIN_USER_ID =
    process.env.ADMIN_USER_ID || "45ef371c-0cbc-4f2a-b9f1-f6078aa6638c";
