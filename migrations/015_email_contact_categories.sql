-- Migration 015: Many-to-many contact categories
-- Replaces single category_id FK on email_contacts with a join table
-- so contacts can belong to multiple categories simultaneously.

-- 1. Create join table
CREATE TABLE IF NOT EXISTS email_contact_categories (
    contact_id UUID NOT NULL REFERENCES email_contacts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES email_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (contact_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_ecc_category ON email_contact_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_ecc_contact ON email_contact_categories(contact_id);

-- 2. Migrate existing category assignments
INSERT INTO email_contact_categories (contact_id, category_id)
SELECT id, category_id FROM email_contacts WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Drop old column
ALTER TABLE email_contacts DROP COLUMN IF EXISTS category_id;
