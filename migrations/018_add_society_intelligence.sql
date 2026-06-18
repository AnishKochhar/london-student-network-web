-- 018_add_society_intelligence.sql
-- LSN Society Intelligence Network — ingestion / enrichment / review / publish
-- engine for London student societies (see "Society Ingestion Engine.MD").
--
-- Tables:
--   universities                 — the 5 target unis (KCL/UCL/LSE/Imperial/QMUL)
--   societies                    — canonical society profiles (the product)
--   society_sources              — every claim is traceable to a source
--   society_import_candidates    — raw imported/scraped rows awaiting review
--   society_contacts             — public society-facing contacts only
--   society_event_candidates     — event-engine foundation
--   society_review_items         — the internal review queue (central)
--   society_claim_invites        — claim DRAFTS only; send_disabled is forced true
--   society_interactions         — analytics foundation
--   saved_societies              — logged-in students' saved/followed societies
--
-- SAFETY: this schema stores NO outbound capability. society_claim_invites can
-- only ever hold drafts/previews — send_disabled is NOT NULL DEFAULT true with a
-- CHECK that pins it true, so a "sent" invite can never be recorded here.
--
-- Apply manually (same convention as migrations 002–017), e.g.:
--   psql "$POSTGRES_URL" -f migrations/018_add_society_intelligence.sql
--   (or: pnpm tsx scripts/apply-society-migration.ts)

-- ---------------------------------------------------------------------------
-- Universities (stable TEXT slug ids so seed mode and DB mode agree)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS universities (
    id                    TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    short_name            TEXT NOT NULL,
    slug                  TEXT NOT NULL UNIQUE,
    city                  TEXT NOT NULL DEFAULT 'London',
    country               TEXT NOT NULL DEFAULT 'United Kingdom',
    official_website_url  TEXT,
    su_website_url        TEXT,
    society_directory_url TEXT,
    enabled               BOOLEAN NOT NULL DEFAULT true,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Societies (the published product)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS societies (
    id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                       TEXT NOT NULL UNIQUE,
    name                       TEXT NOT NULL,
    normalised_name            TEXT NOT NULL DEFAULT '',
    university_id              TEXT NOT NULL REFERENCES universities(id),
    university_name            TEXT NOT NULL DEFAULT '',
    university_short_name      TEXT NOT NULL DEFAULT '',
    type                       TEXT NOT NULL DEFAULT 'unknown',
    category                   TEXT,
    subcategory                TEXT,
    tags                       TEXT[] NOT NULL DEFAULT '{}',
    short_description          TEXT,
    description                TEXT,
    logo_url                   TEXT,
    cover_image_url            TEXT,
    su_profile_url             TEXT,
    membership_url             TEXT,
    website_url                TEXT,
    instagram_url              TEXT,
    tiktok_url                 TEXT,
    linkedin_url               TEXT,
    linktree_url               TEXT,
    public_contact_email       TEXT,
    contact_emails             TEXT[] NOT NULL DEFAULT '{}',
    follower_count             INTEGER,
    member_count               INTEGER,
    activity_score             NUMERIC,
    profile_completeness_score NUMERIC,
    source_confidence_score    NUMERIC,
    duplicate_risk_score       NUMERIC,
    publish_confidence_score   NUMERIC,
    latest_activity_at         TIMESTAMPTZ,
    last_enriched_at           TIMESTAMPTZ,
    last_reviewed_at           TIMESTAMPTZ,
    status                     TEXT NOT NULL DEFAULT 'draft',     -- draft | pending_review | published | needs_review | rejected | duplicate | archived
    claim_status               TEXT NOT NULL DEFAULT 'unclaimed', -- unclaimed | claim_ready | claim_drafted | claim_sent_disabled | claimed | verified | rejected
    is_public                  BOOLEAN NOT NULL DEFAULT false,
    is_featured                BOOLEAN NOT NULL DEFAULT false,
    primary_source_id          UUID,   -- soft link to society_sources (avoids circular FK)
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at               TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- Society sources (provenance for every claim)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_sources (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id       UUID REFERENCES societies(id) ON DELETE SET NULL,
    university_id    TEXT REFERENCES universities(id) ON DELETE SET NULL,
    source_type      TEXT NOT NULL DEFAULT 'other',  -- su_directory | su_profile | lsn_crm | lsn_existing_site | instagram | linktree | website | event_platform | manual | search_result | other
    source_name      TEXT NOT NULL,
    source_url       TEXT,
    raw_title        TEXT,
    raw_text         TEXT,
    raw_html         TEXT,
    extracted_json   JSONB,
    trust_level      TEXT NOT NULL DEFAULT 'low',     -- high | medium | low
    confidence_score NUMERIC,
    last_fetched_at  TIMESTAMPTZ,
    fetch_status     TEXT NOT NULL DEFAULT 'new',     -- new | queued | fetched | failed | ignored
    error_message    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Society import candidates (review queue input)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_import_candidates (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id                UUID REFERENCES society_sources(id) ON DELETE SET NULL,
    university_id            TEXT REFERENCES universities(id) ON DELETE SET NULL,
    raw_name                 TEXT NOT NULL,
    raw_university           TEXT,
    raw_category             TEXT,
    raw_description          TEXT,
    raw_email                TEXT,
    raw_instagram            TEXT,
    raw_membership_url       TEXT,
    raw_su_profile_url       TEXT,
    raw_row                  JSONB,
    extracted_data           JSONB,
    matched_society_id       UUID REFERENCES societies(id) ON DELETE SET NULL,
    duplicate_of_society_id  UUID REFERENCES societies(id) ON DELETE SET NULL,
    confidence_score         NUMERIC,
    duplicate_risk_score     NUMERIC,
    status                   TEXT NOT NULL DEFAULT 'new',  -- new | parsed | matched_existing | created_draft | needs_review | rejected | duplicate | failed
    review_notes             TEXT,
    error_message            TEXT,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Society contacts (public-facing only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_contacts (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id         UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    contact_type       TEXT NOT NULL DEFAULT 'other_public_contact', -- generic_society_email | committee_email | instagram | website_contact_form | other_public_contact
    name               TEXT,
    role               TEXT,
    email              TEXT,
    instagram_handle   TEXT,
    contact_url        TEXT,
    source_url         TEXT,
    confidence_score   NUMERIC,
    is_primary         BOOLEAN NOT NULL DEFAULT false,
    is_publicly_listed BOOLEAN NOT NULL DEFAULT true,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Society event candidates (event-engine foundation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_event_candidates (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id              UUID REFERENCES societies(id) ON DELETE SET NULL,
    university_id           TEXT REFERENCES universities(id) ON DELETE SET NULL,
    title                   TEXT NOT NULL,
    description             TEXT,
    event_date              TIMESTAMPTZ,
    event_time              TEXT,
    location                TEXT,
    source_url              TEXT,
    ticket_url              TEXT,
    image_url               TEXT,
    extracted_from_source_id UUID REFERENCES society_sources(id) ON DELETE SET NULL,
    confidence_score        NUMERIC,
    status                  TEXT NOT NULL DEFAULT 'new',  -- new | pending_review | published | rejected | duplicate | expired
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Society review items (the internal review queue)
-- entity_id is polymorphic (society / candidate / source / ...), so no FK.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_review_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type        TEXT NOT NULL,  -- society | society_import_candidate | society_source | society_contact | society_event_candidate | duplicate_match | instagram_match
    entity_id          UUID NOT NULL,
    title              TEXT NOT NULL,
    summary            TEXT,
    reason             TEXT NOT NULL DEFAULT 'other',
    priority           TEXT NOT NULL DEFAULT 'medium',  -- low | medium | high | critical
    confidence_score   NUMERIC,
    risk_score         NUMERIC,
    recommended_action TEXT NOT NULL DEFAULT 'investigate', -- approve | reject | merge | edit | ignore | investigate
    status             TEXT NOT NULL DEFAULT 'open',     -- open | approved | rejected | merged | needs_more_info | ignored
    reviewer_notes     TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Society claim invites (DRAFTS ONLY — nothing is ever sent)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_claim_invites (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id       UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    contact_id       UUID REFERENCES society_contacts(id) ON DELETE SET NULL,
    email            TEXT,
    claim_token_hash TEXT,
    claim_url_preview TEXT,
    subject_draft    TEXT,
    body_draft       TEXT,
    status           TEXT NOT NULL DEFAULT 'draft',  -- draft | ready | sending_disabled | sent | expired | claimed | cancelled
    -- SAFETY INVARIANT: outbound is disabled in every phase. This column can
    -- never be false, so a "sent" claim invite cannot be persisted.
    send_disabled    BOOLEAN NOT NULL DEFAULT true CHECK (send_disabled),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Society interactions (analytics foundation)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS society_interactions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id       UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
    interaction_type TEXT NOT NULL,  -- profile_view | membership_click | instagram_click | website_click | event_click | save | unsave | share | search_result_click
    metadata         JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Saved / followed societies (per logged-in user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_societies (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, society_id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_societies_public            ON societies (status, is_public);
CREATE INDEX IF NOT EXISTS idx_societies_university        ON societies (university_id);
CREATE INDEX IF NOT EXISTS idx_societies_featured          ON societies (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_societies_normalised        ON societies (normalised_name);
CREATE INDEX IF NOT EXISTS idx_society_sources_university  ON society_sources (university_id);
CREATE INDEX IF NOT EXISTS idx_society_sources_society     ON society_sources (society_id);
CREATE INDEX IF NOT EXISTS idx_society_imports_status      ON society_import_candidates (status);
CREATE INDEX IF NOT EXISTS idx_society_review_items_queue  ON society_review_items (status, priority);
CREATE INDEX IF NOT EXISTS idx_society_event_candidates    ON society_event_candidates (society_id, status);
CREATE INDEX IF NOT EXISTS idx_society_interactions_lookup ON society_interactions (society_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_saved_societies_user        ON saved_societies (user_id);
CREATE INDEX IF NOT EXISTS idx_society_claim_invites_soc   ON society_claim_invites (society_id);

-- ---------------------------------------------------------------------------
-- Seed the five target universities (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO universities (id, name, short_name, slug, city, country, official_website_url, su_website_url, society_directory_url, enabled)
VALUES
    ('kcl', 'King''s College London', 'KCL', 'kcl', 'London', 'United Kingdom', 'https://www.kcl.ac.uk', 'https://www.kclsu.org', 'https://www.kclsu.org/activities/societies', true),
    ('ucl', 'University College London', 'UCL', 'ucl', 'London', 'United Kingdom', 'https://www.ucl.ac.uk', 'https://studentsunionucl.org', 'https://studentsunionucl.org/clubs-societies', true),
    ('lse', 'London School of Economics and Political Science', 'LSE', 'lse', 'London', 'United Kingdom', 'https://www.lse.ac.uk', 'https://www.lsesu.com', 'https://www.lsesu.com/organisation/societies', true),
    ('imperial', 'Imperial College London', 'Imperial', 'imperial', 'London', 'United Kingdom', 'https://www.imperial.ac.uk', 'https://www.imperialcollegeunion.org', 'https://www.imperialcollegeunion.org/activities/a-to-z', true),
    ('qmul', 'Queen Mary University of London', 'QMUL', 'qmul', 'London', 'United Kingdom', 'https://www.qmul.ac.uk', 'https://www.qmsu.org', 'https://www.qmsu.org/groups', true)
ON CONFLICT (id) DO NOTHING;
