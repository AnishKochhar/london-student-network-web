# Opportunities (LSN Jobs) — configuration runbook

How to run the jobs engine as a **self-maintaining board with no human review queue**:
the AI quality gate _is_ the reviewer. High-confidence first-party listings
auto-publish; borderline/junk listings simply never publish and age out via
synthetic deadlines. No one has to empty a review queue.

## Enrichment provider chain

`getEnrichmentProvider()` builds a fallback chain from whichever keys are set,
tried best-first, with the deterministic heuristic as the always-available floor:

```
ANTHROPIC_API_KEY set → Claude (Haiku 4.5)   ─┐
GROQ_API_KEY set      → Groq (gpt-oss-120b)  ─┼─→ first success wins
                        heuristic (no key)   ─┘   (heuristic never auto-publishes)
```

Any error (timeout, refusal, HTTP, bad JSON) drops to the next provider, so
enrichment never hard-fails.

**Why this order** — A/B against Haiku on live listings (2026-07): Haiku has the
best judgment on the graduate-vs-agency-noise boundary; `gpt-oss-120b` agrees on
~90% of publish decisions with 0 schema failures and **fails safe** (over-rejects
a few borderline early-career roles, never publishes junk). `gpt-oss-20b` failed
strict `json_schema` ~10% of the time — **do not use it.** The heuristic caps its
own confidence so it can extract but never trips the auto-publish gate alone.

## Required environment variables

| Var | Value | Where | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-…` | `.env.local` (dev) · Vercel (prod) | Primary enrichment. **Without it, nothing auto-publishes** — the heuristic can't clear the gate. |
| `OPPORTUNITY_AUTOPUBLISH_ENABLED` | `true` | Vercel | Master switch. Off = everything queues for review (the graveyard we're avoiding). |
| `OPPORTUNITY_AUTOPUBLISH_MIN_CONFIDENCE` | `80` (try `82` to tighten) | Vercel | Auto-publish confidence bar. |
| `OPPORTUNITY_AUTOPUBLISH_MIN_RELEVANCE` | `60` | Vercel | Auto-publish relevance bar. Both bars must clear. |
| `OPPORTUNITY_MAX_ENRICH_PER_RUN` | `50` | Vercel | Cost ceiling per cron run. |
| `CRON_SECRET` | (already set) | Vercel | Guards the cron endpoint. Present in Vercel since ~270d — no action. |

## Optional

| Var | Value | Notes |
|---|---|---|
| `GROQ_API_KEY` | `gsk_…` | Enables the gpt-oss-120b fallback behind Claude. ~$2/mo; validated. |
| `OPPORTUNITY_ENRICHMENT_MODEL` | e.g. `claude-haiku-4-5` | Override the Claude model. |
| `OPPORTUNITY_GROQ_MODEL` | e.g. `openai/gpt-oss-120b` | Override the Groq model. Only use one that supports strict `json_schema` — **not** `gpt-oss-20b`. |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | from developer.adzuna.com | Lights up the Adzuna aggregator sources (currently never-run — no key). |
| `ADZUNA_AUTOPUBLISH_MIN_CONFIDENCE` / `_MIN_RELEVANCE` | `72` / `70` | Adzuna-specific gate (lower confidence bar, higher relevance bar). |

## Setting prod values on Vercel

Secrets go in Vercel, **not** in a committed file:

```sh
vercel env add ANTHROPIC_API_KEY production            # paste the prod key
vercel env add OPPORTUNITY_AUTOPUBLISH_ENABLED production   # value: true
vercel env add OPPORTUNITY_AUTOPUBLISH_MIN_CONFIDENCE production  # 80
vercel env add OPPORTUNITY_AUTOPUBLISH_MIN_RELEVANCE production   # 60
vercel env add OPPORTUNITY_MAX_ENRICH_PER_RUN production          # 50
# optional:
vercel env add GROQ_API_KEY production
```

Cost at 50 enrichments/day: **~$13/mo** on Haiku, **~$2/mo** if Groq serves.
Local `.env.local` (gitignored) holds the dev copy of the keys; Vercel holds the
deployment copy. Keep the dev test key and the prod key separate.
