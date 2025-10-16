-- Migration: Fix university_email_domains table to support multiple domains per university
-- Created: 2025-10-04
-- Purpose: Remove UNIQUE constraint on university_code to allow multiple email domains per university
--          (e.g., Imperial can have both @imperial.ac.uk and @ic.ac.uk)

-- ============================================================================
-- STEP 1: Remove the UNIQUE constraint on university_code
-- ============================================================================

-- Drop the unique constraint on university_code
ALTER TABLE university_email_domains
DROP CONSTRAINT IF EXISTS university_email_domains_university_code_key;

-- ============================================================================
-- STEP 2: Add index for performance (non-unique)
-- ============================================================================

-- Add a regular index on university_code for fast lookups (non-unique)
CREATE INDEX IF NOT EXISTS idx_university_domains_code_multi
ON university_email_domains(university_code);

-- ============================================================================
-- STEP 3: Update comments to reflect new schema
-- ============================================================================

COMMENT ON COLUMN university_email_domains.university_code IS
'University code (e.g., "imperial", "ucl") - can have multiple domains per university';

COMMENT ON TABLE university_email_domains IS
'Mapping of .ac.uk email domains to university codes. One university can have multiple domains (e.g., Imperial has both @imperial.ac.uk and @ic.ac.uk)';

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify the constraint is gone
-- Run: \d university_email_domains
-- You should see email_domain as UNIQUE, but NOT university_code

-- ============================================================================
-- Migration complete
-- ============================================================================
