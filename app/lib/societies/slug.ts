/**
 * Slug generation for society profile URLs
 * (`/network/[universitySlug]/[societySlug]`).
 *
 * Reuses the project's existing `generateSlugFromName` helper (the same one the
 * live societies feature and the opportunities engine use) and adds collision
 * handling against a set of slugs already in use within a university.
 */

import { generateSlugFromName } from "@/app/lib/utils";

/**
 * Build a slug for a society, unique within its university.
 * @param name           society name
 * @param universityShortName short university name, used only as a fallback prefix
 * @param taken          set of society slugs already used in that university
 */
export function generateSocietySlug(
    name: string,
    universityShortName: string,
    taken: Set<string>,
): string {
    const base =
        generateSlugFromName(name) ||
        generateSlugFromName(`${universityShortName} ${name}`) ||
        "society";

    if (!taken.has(base)) return base;

    let n = 2;
    while (taken.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}
