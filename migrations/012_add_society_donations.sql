-- Migration: Add standalone society donations table
-- This tracks donations made directly to societies (not tied to event tickets)

-- Create society_donations table
CREATE TABLE IF NOT EXISTS society_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_uid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Donor info (user_id nullable for non-logged-in donors)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    donor_name TEXT,
    donor_email TEXT NOT NULL,

    -- Payment details
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL, -- In pence
    fee_covered INTEGER DEFAULT 0, -- Stripe fee amount covered by donor (in pence)
    currency TEXT DEFAULT 'gbp',
    payment_status TEXT DEFAULT 'pending', -- pending, succeeded, failed, cancelled

    -- Optional message from donor
    message TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT amount_positive CHECK (amount > 0),
    CONSTRAINT fee_covered_non_negative CHECK (fee_covered >= 0)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_society_donations_society ON society_donations(society_uid);
CREATE INDEX IF NOT EXISTS idx_society_donations_session ON society_donations(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_society_donations_user ON society_donations(user_id);
CREATE INDEX IF NOT EXISTS idx_society_donations_status ON society_donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_society_donations_created ON society_donations(created_at DESC);

-- Add comment
COMMENT ON TABLE society_donations IS 'Standalone donations to societies (not tied to event tickets)';
