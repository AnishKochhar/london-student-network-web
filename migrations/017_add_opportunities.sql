-- 017_add_opportunities.sql
-- LSN Jobs / Opportunities — the full-loop "opportunity engine" foundation.
--
-- Tables:
--   opportunity_sources       — registry of places opportunities come from
--   opportunities             — published/draft listings shown on /jobs
--   opportunity_scrape_runs   — one row per scrape attempt against a source
--   opportunity_imports       — raw imported items awaiting review → publish
--   saved_opportunities       — logged-in students' saved listings
--   opportunity_interactions  — analytics events (view/apply/save/...)
--
-- Apply manually (same convention as migrations 002–016), e.g.:
--   psql "$POSTGRES_URL" -f migrations/017_add_opportunities.sql

-- ---------------------------------------------------------------------------
-- Source registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_sources (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    url              TEXT NOT NULL,
    type             TEXT NOT NULL DEFAULT 'other',
    enabled          BOOLEAN NOT NULL DEFAULT true,
    scrape_frequency TEXT NOT NULL DEFAULT 'manual',  -- manual | daily | weekly | monthly
    last_scraped_at  TIMESTAMPTZ,
    next_scrape_at   TIMESTAMPTZ,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Opportunities (the published product)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunities (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                   TEXT NOT NULL UNIQUE,
    title                  TEXT NOT NULL,
    organisation           TEXT NOT NULL,
    organisation_logo_url  TEXT,
    type                   TEXT NOT NULL DEFAULT 'other',   -- internship | graduate | part_time | full_time | placement | volunteer | event | other
    location               TEXT,
    location_type          TEXT,                            -- on_site | hybrid | remote
    salary_text            TEXT,
    summary                TEXT,                            -- 2-line summary for cards
    description_md         TEXT,                            -- full markdown body
    tags                   TEXT[] NOT NULL DEFAULT '{}',
    good_for               TEXT[] NOT NULL DEFAULT '{}',
    requirements           TEXT[] NOT NULL DEFAULT '{}',
    benefits               TEXT[] NOT NULL DEFAULT '{}',
    apply_url              TEXT,
    deadline               TIMESTAMPTZ,
    source_url             TEXT,
    source_name            TEXT,
    source_id              UUID REFERENCES opportunity_sources(id) ON DELETE SET NULL,
    created_from_import_id UUID,                            -- soft link (imports created later); no FK to avoid circular dependency
    status                 TEXT NOT NULL DEFAULT 'draft',   -- draft | published | closed | archived
    featured               BOOLEAN NOT NULL DEFAULT false,
    view_count             INTEGER NOT NULL DEFAULT 0,
    apply_count            INTEGER NOT NULL DEFAULT 0,
    save_count             INTEGER NOT NULL DEFAULT 0,
    created_by             UUID,
    published_at           TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Scrape runs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_scrape_runs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id        UUID NOT NULL REFERENCES opportunity_sources(id) ON DELETE CASCADE,
    status           TEXT NOT NULL DEFAULT 'queued',  -- queued | running | completed | failed
    started_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ,
    items_found      INTEGER NOT NULL DEFAULT 0,
    items_imported   INTEGER NOT NULL DEFAULT 0,
    duplicates_found INTEGER NOT NULL DEFAULT 0,
    errors_count     INTEGER NOT NULL DEFAULT 0,
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Imports (review queue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_imports (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id                   UUID REFERENCES opportunity_sources(id) ON DELETE SET NULL,
    scrape_run_id               UUID REFERENCES opportunity_scrape_runs(id) ON DELETE SET NULL,
    source_url                  TEXT,
    source_name                 TEXT,
    raw_title                   TEXT,
    raw_text                    TEXT NOT NULL DEFAULT '',
    raw_html                    TEXT,
    extracted_data              JSONB,
    status                      TEXT NOT NULL DEFAULT 'new',  -- new | enriched | pending_review | published | rejected | duplicate | failed
    duplicate_of_opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    created_opportunity_id      UUID REFERENCES opportunities(id) ON DELETE SET NULL,
    ai_summary                  TEXT,
    ai_quality_score            NUMERIC,
    ai_relevance_score          NUMERIC,
    ai_confidence_score         NUMERIC,
    ai_reasoning                TEXT,
    error_message               TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Saved opportunities (per logged-in user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_opportunities (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, opportunity_id)
);

-- ---------------------------------------------------------------------------
-- Interactions (analytics foundation for the learning engine)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS opportunity_interactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
    event_type     TEXT NOT NULL,  -- view | apply_click | save | unsave | share | filter_used | search_used
    metadata       JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_opportunities_status_deadline   ON opportunities (status, deadline);
CREATE INDEX IF NOT EXISTS idx_opportunities_featured          ON opportunities (featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_opportunities_published_at      ON opportunities (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_type              ON opportunities (type);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_user        ON saved_opportunities (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_opportunities_pair        ON saved_opportunities (user_id, opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_imports_status      ON opportunity_imports (status);
CREATE INDEX IF NOT EXISTS idx_opportunity_interactions_lookup ON opportunity_interactions (opportunity_id, event_type);
CREATE INDEX IF NOT EXISTS idx_opportunity_scrape_runs_source  ON opportunity_scrape_runs (source_id);
