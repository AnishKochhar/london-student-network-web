-- Migration: Add university email verification and event visibility controls
-- Created: 2025-10-04
-- Purpose: Enable university email verification, event visibility controls, and age verification

-- ============================================================================
-- PHASE 1.1: Add university verification columns to users table
-- ============================================================================

-- Add university email and verification fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS university_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS university_email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_university VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'student',
ADD COLUMN IF NOT EXISTS university_email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS university_email_token_expires TIMESTAMP;

-- Create unique index on university_email (sparse index - only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_university_email
ON users(university_email) WHERE university_email IS NOT NULL;

-- Create index on verified_university for fast filtering
CREATE INDEX IF NOT EXISTS idx_users_verified_university
ON users(verified_university) WHERE verified_university IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.university_email IS 'Verified .ac.uk email address for university students';
COMMENT ON COLUMN users.university_email_verified IS 'Whether the university email has been verified';
COMMENT ON COLUMN users.verified_university IS 'Extracted university name from verified .ac.uk email (e.g., "kcl", "ucl")';
COMMENT ON COLUMN users.account_type IS 'Account type: student (default), alumni, external';
COMMENT ON COLUMN users.university_email_verification_token IS 'Temporary token for university email verification';
COMMENT ON COLUMN users.university_email_token_expires IS 'Expiration timestamp for verification token';

-- ============================================================================
-- PHASE 1.2: Add event visibility and registration controls to events table
-- ============================================================================

-- Add visibility and registration control fields
ALTER TABLE events
ADD COLUMN IF NOT EXISTS visibility_level VARCHAR(50) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS registration_level VARCHAR(50) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS allowed_universities TEXT[],
ADD COLUMN IF NOT EXISTS lock_external_24h BOOLEAN DEFAULT false;

-- Create index on visibility_level for fast filtering
CREATE INDEX IF NOT EXISTS idx_events_visibility_level
ON events(visibility_level);

-- Create index on registration_level
CREATE INDEX IF NOT EXISTS idx_events_registration_level
ON events(registration_level);

-- Add comments for documentation
COMMENT ON COLUMN events.visibility_level IS 'Who can see this event: public, logged_in, university_only, multi_university';
COMMENT ON COLUMN events.registration_level IS 'Who can register: public, logged_in, university_only, multi_university';
COMMENT ON COLUMN events.allowed_universities IS 'Array of university codes for multi_university events (e.g., ["kcl", "ucl"])';
COMMENT ON COLUMN events.lock_external_24h IS 'Lock external registrations 24 hours before event (internal users can still register)';

-- ============================================================================
-- PHASE 1.3: Create university email domains lookup table
-- ============================================================================

-- Create table for university email domain mappings
CREATE TABLE IF NOT EXISTS university_email_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_code VARCHAR(50) NOT NULL UNIQUE,
    university_name VARCHAR(255) NOT NULL,
    email_domain VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email_domain for fast lookups during verification
CREATE UNIQUE INDEX IF NOT EXISTS idx_university_domains_email
ON university_email_domains(email_domain) WHERE is_active = true;

-- Create index on university_code
CREATE INDEX IF NOT EXISTS idx_university_domains_code
ON university_email_domains(university_code);

-- Add comments
COMMENT ON TABLE university_email_domains IS 'Mapping of .ac.uk email domains to university codes for verification';
COMMENT ON COLUMN university_email_domains.university_code IS 'Short university code (e.g., "kcl", "ucl", "imperial")';
COMMENT ON COLUMN university_email_domains.university_name IS 'Full university name for display';
COMMENT ON COLUMN university_email_domains.email_domain IS 'Email domain for verification (e.g., "kcl.ac.uk", "ucl.ac.uk")';
COMMENT ON COLUMN university_email_domains.is_active IS 'Whether this domain is currently active for verification';

-- Insert initial university mappings (London universities)
INSERT INTO university_email_domains (university_code, university_name, email_domain) VALUES
    ('kcl', 'King''s College London', 'kcl.ac.uk'),
    ('ucl', 'University College London', 'ucl.ac.uk'),
    ('imperial', 'Imperial College London', 'imperial.ac.uk'),
    ('lse', 'London School of Economics', 'lse.ac.uk'),
    ('qmul', 'Queen Mary University of London', 'qmul.ac.uk'),
    ('city', 'City, University of London', 'city.ac.uk'),
    ('brunel', 'Brunel University London', 'brunel.ac.uk'),
    ('roehampton', 'University of Roehampton', 'roehampton.ac.uk'),
    ('westminster', 'University of Westminster', 'westminster.ac.uk'),
    ('greenwich', 'University of Greenwich', 'greenwich.ac.uk'),
    ('kingston', 'Kingston University', 'kingston.ac.uk'),
    ('southbank', 'London South Bank University', 'lsbu.ac.uk'),
    ('arts', 'University of the Arts London', 'arts.ac.uk'),
    ('goldsmiths', 'Goldsmiths, University of London', 'gold.ac.uk'),
    ('soas', 'SOAS University of London', 'soas.ac.uk'),
    ('royal-holloway', 'Royal Holloway, University of London', 'rhul.ac.uk'),
    ('st-georges', 'St George''s, University of London', 'sgul.ac.uk'),
    ('birkbeck', 'Birkbeck, University of London', 'bbk.ac.uk'),
    ('middlesex', 'Middlesex University', 'mdx.ac.uk'),
    ('london-met', 'London Metropolitan University', 'londonmet.ac.uk')
ON CONFLICT (email_domain) DO NOTHING;

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Next steps:
-- 1. Update NextAuth session to include university_email and verified_university
-- 2. Create verification email utilities
-- 3. Add verification UI to account page
-- 4. Update event creation form with visibility controls
-- 5. Add registration permission checks
