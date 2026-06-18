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
| P3 | Source registry | in_progress | admin sources page + seed 5 SU + CRM + existing-LSN |
| P4 | CRM import | pending | xlsx parser + upload UI + dedup + summary |
| P5 | SU directory ingestion | pending | manual-paste + best-effort live fetch + review |
| P6 | Matching / dedup | pending | normalise + fingerprint + similarity + merge UI |
| P7 | Profile creation | pending | candidate→draft→published + scoring gate |
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
