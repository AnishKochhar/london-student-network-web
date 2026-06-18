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
| P7 | Profile creation | committed | scoring + candidate→draft→publish gate + societies list/detail; 58 tests; reviewed |
| P8 | Social enrichment | committed | social extract + IG confidence gate + profile enrich; 70 tests; reviewed |
| P9 | Review queue | committed | decision engine + quality review + queue UI; 76 tests; reviewed |
| P10 | Public directory (/network) | committed | directory+profile, published-only, smoke-tested live; 83 tests; reviewed |
| P11 | Claim plumbing | committed | readiness + draft + preview page; sendDisabled true (4 layers); 90 tests; reviewed |
| P12 | Event candidate foundation | committed | extractor + discover + admin events tab; 93 tests; reviewed |
| P13 | Analytics foundation | in_progress | interactions + metrics |

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
- P7 done: scoring.ts (completeness/sourceConfidence/uniConfidence/publishConfidence + conservative
  isSocietyPublishEligible per spec §10–11), publish.ts (recomputeSocietyScores, candidateToDraftSociety,
  gated publishSocietyProfile + explicit force, unpublish, setSocietyPublicStatus, bulkPublish),
  societies list + detail/edit admin pages, promote-to-draft from imports, APIs. Publishing only via
  the gate or explicit force; drafts never auto-publish. Review fixes (2×HIGH): setSocietyPublicStatus
  can't expose a draft (only toggle published rows), and the edit PATCH whitelists content fields so
  status/isPublic/scores can't be edited in. Gates clean, 58/58 vitest. Committed as `Society P7`.
- P8 done: enrich.ts (extractSocialLinksFromHtml, scoreInstagramMatch w/ confidence gate, profile
  helpers: shortDescription/classifyCategory/tags, enrichSociety gap-fill + IG attach/review),
  prompts.ts (spec §14 enrichment prompt, stored constant — not invoked), enrich API + detail-page
  Enrich button. IG gate: >=90 silent attach, 70–89 attach+review, <70 skip. No network/LLM/outbound.
  Review fixes (HIGH+MED): IG silent-attach now needs a strong (>=6ch) token or uni-prefix
  corroboration (stops Law→lawnmower etc.); website capture skips social/SU/.ac.uk hosts.
  Gates clean, 70/70 vitest. Committed as `Society P8`.
- P9 done: review.ts (applyReviewDecision — merge/reject/approve/ignore/needs_more_info each mutate
  the underlying entity: merge candidate→society, free a non-duplicate, detach a wrong Instagram,
  reject candidate/society; runSocietyQualityReview generates+dedupes items), review queue UI
  (/admin/societies/review, priority/reason/recommended action, per-item actions), review APIs.
  No review action sends anything (spec §8.4). Review fix (MED): decisions guarded to open items
  only (no replay re-firing side-effects). Gates clean, 76/76 vitest. Committed as `Society P9`.
- P10 done: public /network directory (hero, search, uni tabs, type/category/sort filters, card
  grid, disabled claim CTA) + /network/[universitySlug]/[societySlug] profile (hero, socials,
  membership/SU links, similar societies, unclaimed badge, source disclaimer, generateMetadata).
  selectors.ts (filter/sort/collect/similar, pure). Published-only enforced via getPublishedSociet*.
  SMOKE-TESTED live (store mode): directory shows 5 published seeds, profile renders, draft/unknown
  → not-found with NO content leak. Review: no high/med; hardened logo <img> to http(s)-only.
  NOTE: env has POSTGRES_URL set, so DB mode needs migration 018 applied to function — applying it
  to the live DB was DENIED by the safety classifier (correct; user must run it explicitly). Store
  mode fully works. Gates clean, 83/83 vitest. Committed as `Society P10`.
- P11 done: claim.ts (evaluateClaimReadiness §6.12, isSocietyClaimReady, markSocietyClaimReady,
  generateClaimUrlPreview [non-functional preview], generateClaimInviteDraft), createClaimInvite
  mutation + getClaimInviteForSociety query, claim API (generate_draft/mark_ready — NO send),
  claim-preview admin page with the big "Sending is disabled" banner and NO send button.
  Independent review confirmed the no-outbound guarantee holds, enforced at 4 layers (TS literal
  `sendDisabled: true`, no input param, DB DEFAULT+CHECK, hardcoded read-back); no real /claim
  route; raw token not persisted (only its hash). Gates clean, 90/90 vitest. Committed as `Society P11`.
- P12 done: events.ts (parseLooseDate, extractEventCandidatesFromHtml [event-platform links only],
  discoverSocietyEventCandidates [from society's stored source HTML, deduped, status 'new', never
  published], linkEventCandidateToSociety), createEventCandidate/updateEventCandidate +
  listEventCandidates, events APIs, society-events PATCH (approve→pending_review, never published),
  detail-page events tab. Review: no high/med; fixed DB updateEventCandidate to also persist
  university_id/source_url/image_url/extracted_from_source_id. Gates clean, 93/93 vitest.
  Committed as `Society P12`.

## ⚠️ Deployment note
This environment's `.env` has POSTGRES_URL set → `hasDb()` is true. The society tables don't exist
in that DB yet, so admin/public pages error until **migration 018 is applied** by the user:
`psql "$POSTGRES_URL" -f migrations/018_add_society_intelligence.sql` (or
`pnpm tsx scripts/apply-society-migration.ts`). All phases are verified in STORE mode (empty
POSTGRES_URL). Auto-applying the migration was intentionally blocked by the safety classifier.
