/**
 * Slug generation for opportunity detail URLs (`/jobs/[slug]`).
 *
 * Reuses the project's existing `generateSlugFromName` helper (used for society
 * slugs) and adds collision handling against a set of slugs already in use.
 */

import { generateSlugFromName } from "@/app/lib/utils";

/**
 * Build a unique slug from an opportunity's title + organisation.
 * @param title        opportunity title
 * @param organisation organisation name (appended for uniqueness/context)
 * @param taken        set of slugs that already exist
 */
export function buildOpportunitySlug(
    title: string,
    organisation: string,
    taken: Set<string>,
): string {
    const base =
        generateSlugFromName(`${title} ${organisation}`) ||
        generateSlugFromName(title) ||
        "opportunity";

    if (!taken.has(base)) return base;

    // Append a numeric suffix until we find a free slug.
    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}
