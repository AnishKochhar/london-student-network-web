# Society Intelligence Network — Build Progress Ledger

> Durable, committed tracker for the autonomous overnight build. On any resume
> (e.g. after a usage reset), read `git log --oneline` for `Society P*` commits +
> this file, then continue from the first phase that is not `committed`.
>
> Plan: `/Users/josh/.claude/plans/read-society-ingestion-engine-md-reactive-rossum.md`
> Branch: `feat/society-intelligence-network` (commit only society-scoped paths).
> Hard rule: NO outbound communication. Claim/contact plumbing is draft/preview only.

## Phase status

| Phase | Title | Status | Notes |
|-------|-------|--------|-------|
| P2 | Core models & seeds | committed | types, migration 018, seed↔DB, queries/mutations; 13 tests pass; reviewed |
| P3 | Source registry | committed | registry agent + admin dashboard + sources page + API; 18 tests; reviewed |
| P4 | CRM import | committed | xlsx/csv upload + column inference + dedup + review routing + summary; 25 tests; reviewed |
| P5 | SU directory ingestion | committed | parser + manual-paste + live fetch (SSRF-guarded) + ingest page; 35 tests; reviewed |
| P6 | Matching / dedup | committed | similarity + duplicate risk + gap-fill merge + rescan; 49 tests; reviewed |
| P7 | Profile creation | in_progress | candidate→draft→published + scoring gate |
| P8 | Social enrichment | pending | attach socials, uncertain → review |
| P9 | Review queue | pending | approve/reject/merge/edit/ignore |
| P10 | Public directory (/network) | pending | cards, filters, profile, disclaimer |
| P11 | Claim plumbing | pending | draft invite + preview, sendDisabled always true |
| P12 | Event candidate foundation | pending | model + extractor + admin tab |
| P13 | Analytics foundation | pending | interactions + metrics |

## Self-validation per phase

`npm run typecheck` · `npm run lint` · `npm run test` must pass, then an independent
review subagent audits the diff (esp. the no-outbound invariant), then commit
`Society P{n}: <summary>`.

## Log

- P2 started: scaffolding `app/lib/societies/` mirroring `app/lib/opportunities/`.
- P2 done: 10 tables (migration 018), full types, db mappers, seed↔DB queries/mutations,
  seed (5 unis + 6 societies + 7 sources), normalise/slug helpers, apply-script. Gates:
  typecheck clean, eslint clean, 13/13 vitest pass. Independent review: no high/med defects,
  no-outbound invariant confirmed. Committed as `Society P2`.
- P3 done: source-registry agent (seed/queue-fetch/disable/enable), admin dashboard
  (/admin/societies) with outbound-disabled banner + per-uni stats, sources mgmt page
  (/admin/societies/sources), API routes (society-sources GET/POST/PATCH/DELETE + seed) all
  requireAdmin-guarded, reusable banner + society sub-nav (shared sidebar untouched). Review
  fix: hardened all update mutations with stripUndefined so partial patches don't null fields.
  Gates: typecheck/eslint clean, 18/18 vitest pass. Committed as `Society P3`.
- P4 done: CRM Import Agent (crm.ts) — whole-token column inference, row→candidate
  mapping (preserves rawRow), conservative dedup vs societies+candidates+intra-batch,
  uncertain rows → review items; admin imports page with xlsx/csv upload (client XLSX
  parse) + sample importer + summary + candidate actions; API society-imports (crm POST,
  list GET, [id] PATCH). NEVER writes societies (verified). Real CRM file absent — proven
  on synthetic fixtures. Review fix: replaced substring header matching with whole-token
  matching (Instagram→category etc.) + tightened parseCount. Gates: clean, 25/25 vitest.
  Committed as `Society P4`.
- P5 done: SU directory ingestion — scrape.ts (SSRF-guarded fetchPublicPage), su-directory.ts
  (parseSuDirectoryHtml + ingestSuDirectoryHtml + best-effort live ingestSuDirectoryFromSource),
  ingest API (manual paste or live fetch → 422 w/ paste hint on failure), /admin/societies/ingest
  page, "Ingest" nav link. High-trust candidates only (never auto-publishes); duplicates → review.
  Review fix (HIGH): blocked all IPv6 literals in assertSafeUrl (the [::1] check was dead) +
  manual per-hop redirect revalidation; added SSRF unit tests. Gates clean, 35/35 vitest.
  Committed as `Society P5`.
- P6 done: matching.ts (nameSimilarity token-Jaccard, calculateSocietyMatchScore w/ uni
  agreement + URL/IG/email/category signals + acronym nudge, findPotentialDuplicateSocieties,
  calculateDuplicateRisk, gap-fill mergeSocietyData), dedupe.ts (findMatchesForCandidate,
  rescanCandidatesForDuplicates, human-only mergeCandidateIntoSociety), rescan + matches APIs,
  merge_into PATCH, "Scan for duplicates" button. Never auto-merges/publishes. Review fixes
  (4×MED/LOW): acronym demoted to a +12 score nudge (no IT↔International-Tennis false hits),
  all-generic names normalise to empty (no stub false-dupes), rescan de-dupes vs all-status
  review items + skips resolved candidates. Gates clean, 49/49 vitest. Committed as `Society P6`.
