/**
 * Name normalisation + fingerprinting for society matching (spec §6.5 / §13).
 *
 * `normaliseSocietyName` strips the noise that makes "KCL Politics Society",
 * "King's Politics Society" and "KCLSU Politics Society" look different so the
 * matching layer (P6) can compare them. Fingerprints are stable, content-based
 * keys used for cheap duplicate lookups.
 *
 * IMPORTANT: normalisation is deliberately conservative — it must NOT collapse
 * genuinely different societies (e.g. "International Relations" vs
 * "International Security Studies"). It only removes boilerplate/affiliation.
 */

// University affiliation tokens that carry no distinguishing meaning.
const UNIVERSITY_TOKENS = [
    "kcl",
    "kclsu",
    "kings",
    "king's",
    "ucl",
    "uclu",
    "lse",
    "lsesu",
    "imperial",
    "icu",
    "qmul",
    "qmsu",
    "queen mary",
    "queen mary's",
    "university of london",
    "university college london",
];

// Generic suffixes/words that don't distinguish one society from another.
const GENERIC_TOKENS = [
    "society",
    "societies",
    "soc",
    "club",
    "association",
    "assoc",
    "group",
    "the",
    "students",
    "student",
    "union",
    "official",
];

/** Lowercase, strip punctuation, collapse whitespace. */
export function basicClean(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "") // strip accents
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Normalise a society name for matching: clean, then drop university affiliation
 * and generic society words, then collapse whitespace. Returns a stable string.
 */
export function normaliseSocietyName(name: string): string {
    let s = basicClean(name);

    // Remove university tokens. Clean each token the SAME way as the input so
    // possessives line up — e.g. "King's" and the input both become "king s".
    for (const tok of UNIVERSITY_TOKENS) {
        const cleaned = basicClean(tok);
        if (!cleaned) continue;
        s = s.replace(new RegExp(`\\b${escapeRegex(cleaned)}\\b`, "g"), " ");
    }
    s = s.replace(/\s+/g, " ").trim();

    const words = s
        .split(/\s+/)
        .filter((w) => w && !GENERIC_TOKENS.includes(w));

    // If stripping leaves nothing (e.g. "The Society"), return empty rather than
    // falling back to the un-stripped name — an all-generic name carries no
    // distinguishing signal and must NOT be treated as a match key (it would
    // make every stub name look like a duplicate). Such names route to review.
    return words.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * A short alphabetical fingerprint: normalised words sorted + joined. Catches
 * word-order variants ("Politics KCL Society" vs "KCL Politics Society").
 */
export function generateSocietyFingerprint(
    name: string,
    universityId?: string | null,
): string {
    const words = normaliseSocietyName(name).split(/\s+/).filter(Boolean).sort();
    const key = words.join("-");
    return universityId ? `${universityId}:${key}` : key;
}

/** Derive an acronym from a name, e.g. "International Security Studies" → "iss". */
export function deriveAcronym(name: string): string {
    return normaliseSocietyName(name)
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("");
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
