/**
 * Public barrel for the Society Intelligence Network module.
 *
 * Import from `@/app/lib/societies` rather than reaching into individual files.
 * Everything here is read/write data + pure helpers — there is intentionally no
 * outbound-communication surface anywhere in this module.
 */

export * from "./types";
export * from "./universities";
export * from "./normalise";
export * from "./slug";
export * as societyQueries from "./queries";
export * as societyMutations from "./mutations";
