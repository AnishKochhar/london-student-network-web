-- Migration: Add slug support for society URLs
-- Created: 2025-01-03
-- Purpose: Enable human-readable URLs like /societies/kcl-neurotech

-- Step 1: Add slug column (nullable initially for migration)
ALTER TABLE society_information
ADD COLUMN IF NOT EXISTS slug VARCHAR(60);

-- Step 2: Create unique index for fast lookups and constraint enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_society_slug
ON society_information(slug);

-- Step 3: Add comment for documentation
COMMENT ON COLUMN society_information.slug IS 'URL-friendly slug for society pages (e.g., "kcl-neurotech"). Immutable after creation.';

-- Note: Slugs will be populated via the seed route at /api/seed/generate-slugs
-- After migration is complete and verified, run:
-- ALTER TABLE society_information ALTER COLUMN slug SET NOT NULL;
