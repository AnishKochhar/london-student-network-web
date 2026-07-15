/**
 * Public surface of the opportunities domain module.
 *
 * Import from "@/app/lib/opportunities" everywhere. Server-only modules
 * (queries/mutations/scrape/enrich use @vercel/postgres) — do not import this
 * barrel into Client Components; import `./selectors` and `./types` there
 * instead (they are dependency-free).
 */

export * from "./types";
export * from "./selectors";
export * from "./queries";
export * from "./mutations";
export * from "./scrape";
export * from "./enrich";
