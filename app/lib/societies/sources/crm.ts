/**
 * LSN CRM Import Agent (spec §6.3).
 *
 * Maps rows from the old "LSN SOC outreach CRM" spreadsheet into
 * SocietyImportCandidate records. The spreadsheet's exact column names aren't
 * known (the file isn't in the repo yet), so `inferCrmColumns` matches headers
 * heuristically — Society Name / University / SU URL / Email / Instagram /
 * Category / Member count / Notes — and anything unmapped is preserved in
 * `rawRow`.
 *
 * Rules honoured:
 *  - Never overwrite existing societies — we only ever create *candidates*.
 *  - Preserve the original raw row.
 *  - Detect obvious duplicates (normalised name + university).
 *  - Route uncertain rows (no clear university, possible duplicate) to review.
 *
 * The XLSX/CSV binary parsing happens client-side (admin upload page); this
 * module works on already-parsed row objects so it stays pure and testable.
 */

import { normaliseSocietyName } from "../normalise";
import { resolveUniversityId } from "../universities";
import { getAllSocieties, listImportCandidates } from "../queries";
import {
    createImportCandidate,
    createReviewItem,
    type ImportCandidateInput,
} from "../mutations";
import type { Society, SocietyImportCandidate } from "../types";

export type CrmRow = Record<string, unknown>;

export type CrmColumnMap = {
    name?: string;
    university?: string;
    category?: string;
    description?: string;
    email?: string;
    instagram?: string;
    membershipUrl?: string;
    suProfileUrl?: string;
    memberCount?: string;
    notes?: string;
};

export type CrmImportSummary = {
    rowsReceived: number;
    candidatesCreated: number;
    possibleDuplicates: number;
    reviewRequired: number;
    failed: number;
    columnMap: CrmColumnMap;
    candidateIds: string[];
};

// Field → header patterns, in priority order. More specific fields are matched
// first so generic patterns (e.g. "url") don't steal a better column. Patterns
// are matched against WHOLE word-tokens of the header (or the full concatenated
// header), never as substrings — so "Instagram" can't match "tag" and "uni"
// can't match "Communications".
const FIELD_PATTERNS: [keyof CrmColumnMap, string[]][] = [
    ["name", ["societyname", "nameofsociety", "clubname", "organisationname", "orgname", "name", "society", "club", "organisation", "org"]],
    ["university", ["university", "uni", "institution", "campus", "school", "college"]],
    ["email", ["contactemail", "emailaddress", "email", "mail"]],
    ["instagram", ["instagram", "insta", "ig", "handle", "socials", "social"]],
    ["membershipUrl", ["membershipurl", "membership", "joinurl", "join", "signup"]],
    ["suProfileUrl", ["suurl", "suprofileurl", "unionurl", "profileurl", "website", "weburl", "url", "link", "su"]],
    ["category", ["category", "categories", "theme", "type", "tags", "tag"]],
    ["memberCount", ["membercount", "numberofmembers", "noofmembers", "members", "member", "headcount", "size"]],
    ["description", ["description", "desc", "about", "bio", "summary", "blurb"]],
    ["notes", ["status", "notes", "note", "outreach", "comment", "comments", "remarks"]],
];

/** Split a header into its normalised whole-word tokens + concatenated form. */
function headerParts(header: string): { full: string; tokens: string[] } {
    const lower = header.toLowerCase();
    return {
        full: lower.replace(/[^a-z0-9]/g, ""),
        tokens: lower.split(/[^a-z0-9]+/).filter(Boolean),
    };
}

/** Heuristically map spreadsheet headers to canonical fields (whole-token match). */
export function inferCrmColumns(headers: string[]): CrmColumnMap {
    const map: CrmColumnMap = {};
    const used = new Set<string>();
    for (const [field, patterns] of FIELD_PATTERNS) {
        for (const header of headers) {
            if (used.has(header)) continue;
            const { full, tokens } = headerParts(header);
            if (!full) continue;
            if (patterns.some((p) => full === p || tokens.includes(p))) {
                map[field] = header;
                used.add(header);
                break;
            }
        }
    }
    return map;
}

function cell(row: CrmRow, key?: string): string | null {
    if (!key) return null;
    const v = row[key];
    if (v == null) return null;
    const s = String(v).trim();
    return s.length ? s : null;
}

function parseCount(v: string | null): number | null {
    if (!v) return null;
    // First run of digits (with thousands separators), e.g. "~1,200 members" → 1200.
    const match = v.match(/\d[\d,]*/);
    if (!match) return null;
    const n = parseInt(match[0].replace(/,/g, ""), 10);
    return Number.isNaN(n) ? null : n;
}

/**
 * Map a single CRM row to a candidate input (without persisting). Returns null
 * if the row has no usable society name.
 */
export function mapCrmRowToCandidate(
    row: CrmRow,
    columns: CrmColumnMap,
    opts: { sourceId?: string | null } = {},
): ImportCandidateInput | null {
    const rawName = cell(row, columns.name);
    if (!rawName) return null;

    const rawUniversity = cell(row, columns.university);
    const universityId = resolveUniversityId(rawUniversity);

    return {
        sourceId: opts.sourceId ?? null,
        universityId,
        rawName,
        rawUniversity,
        rawCategory: cell(row, columns.category),
        rawDescription: cell(row, columns.description),
        rawEmail: cell(row, columns.email),
        rawInstagram: cell(row, columns.instagram),
        rawMembershipUrl: cell(row, columns.membershipUrl),
        rawSuProfileUrl: cell(row, columns.suProfileUrl),
        rawRow: row,
        extractedData: {
            name: rawName,
            ...(universityId ? { universityId } : {}),
            ...(cell(row, columns.category)
                ? { category: cell(row, columns.category) }
                : {}),
            memberCount: parseCount(cell(row, columns.memberCount)),
        } as Partial<Society>,
        matchedSocietyId: null,
        duplicateOfSocietyId: null,
        confidenceScore: null,
        duplicateRiskScore: null,
        reviewNotes: cell(row, columns.notes),
    };
}

/** Exact normalised-name + university match (the conservative P4 dedup). */
function findDuplicate<T extends { universityId?: string | null }>(
    items: T[],
    getName: (t: T) => string,
    normalisedName: string,
    universityId: string | null,
): T | undefined {
    return items.find(
        (it) =>
            normaliseSocietyName(getName(it)) === normalisedName &&
            (universityId ? it.universityId === universityId : true),
    );
}

/**
 * Import CRM rows: map → dedup → create candidates → route uncertain to review.
 * Never touches the `societies` table.
 */
export async function importCrmRows(
    rows: CrmRow[],
    opts: { sourceId?: string | null } = {},
): Promise<CrmImportSummary> {
    const headers = rows.length ? Object.keys(rows[0]) : [];
    const columns = inferCrmColumns(headers);

    const existingSocieties = await getAllSocieties();
    const existingCandidates = await listImportCandidates();

    const summary: CrmImportSummary = {
        rowsReceived: rows.length,
        candidatesCreated: 0,
        possibleDuplicates: 0,
        reviewRequired: 0,
        failed: 0,
        columnMap: columns,
        candidateIds: [],
    };

    // Track names created in this batch to catch intra-file duplicates too.
    const createdThisBatch: SocietyImportCandidate[] = [];

    for (const row of rows) {
        const input = mapCrmRowToCandidate(row, columns, opts);
        if (!input) {
            summary.failed++;
            continue;
        }

        const normalisedName = normaliseSocietyName(input.rawName);
        const universityId = input.universityId ?? null;

        const dupSociety = findDuplicate(
            existingSocieties,
            (s) => s.name,
            normalisedName,
            universityId,
        );
        const dupCandidate =
            findDuplicate(
                existingCandidates,
                (c) => c.rawName,
                normalisedName,
                universityId,
            ) ??
            findDuplicate(
                createdThisBatch,
                (c) => c.rawName,
                normalisedName,
                universityId,
            );

        let status: SocietyImportCandidate["status"] = "new";
        let reviewReason:
            | "possible_duplicate"
            | "unclear_university"
            | null = null;

        if (dupSociety || dupCandidate) {
            status = "duplicate";
            input.duplicateOfSocietyId = dupSociety?.id ?? null;
            input.duplicateRiskScore = 80;
            reviewReason = "possible_duplicate";
            summary.possibleDuplicates++;
        } else if (!universityId) {
            status = "needs_review";
            reviewReason = "unclear_university";
        }

        const candidate = await createImportCandidate({ ...input, status });
        createdThisBatch.push(candidate);
        summary.candidatesCreated++;
        summary.candidateIds.push(candidate.id);

        if (reviewReason) {
            summary.reviewRequired++;
            await createReviewItem({
                entityType:
                    reviewReason === "possible_duplicate"
                        ? "duplicate_match"
                        : "society_import_candidate",
                entityId: candidate.id,
                title: input.rawName,
                summary:
                    reviewReason === "possible_duplicate"
                        ? `Possible duplicate of an existing ${dupSociety ? "society" : "candidate"}.`
                        : `University could not be resolved from "${input.rawUniversity ?? "—"}".`,
                reason: reviewReason,
                priority: reviewReason === "possible_duplicate" ? "high" : "medium",
                confidenceScore: null,
                riskScore: reviewReason === "possible_duplicate" ? 80 : null,
                recommendedAction:
                    reviewReason === "possible_duplicate" ? "merge" : "investigate",
            });
        }
    }

    return summary;
}
