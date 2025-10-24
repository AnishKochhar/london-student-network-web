-- Migration: Add Stripe payment infrastructure
-- Created: 2025-10-23
-- Purpose: Enable Stripe Connect accounts for organizers and payment tracking for paid events

-- ============================================================================
-- PHASE 1: Add Stripe Connect fields to users table
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT false;

-- Create index for fast Connect account lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_account
ON users(stripe_connect_account_id)
WHERE stripe_connect_account_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.stripe_connect_account_id IS 'Stripe Express account ID for organizers/societies';
COMMENT ON COLUMN users.stripe_onboarding_complete IS 'Whether organizer has completed Stripe onboarding';
COMMENT ON COLUMN users.stripe_charges_enabled IS 'Whether the Connect account can accept payments';
COMMENT ON COLUMN users.stripe_payouts_enabled IS 'Whether the Connect account can receive payouts';
COMMENT ON COLUMN users.stripe_details_submitted IS 'Whether all required details have been submitted to Stripe';

-- ============================================================================
-- PHASE 2: Create event_payments table for payment tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_uuid UUID NOT NULL REFERENCES tickets(ticket_uuid) ON DELETE CASCADE,
    registration_id UUID REFERENCES event_registrations(event_registration_uuid) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Stripe identifiers
    stripe_checkout_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),

    -- Amounts (in pence for GBP)
    amount_total INTEGER NOT NULL,
    platform_fee INTEGER NOT NULL,
    organizer_amount INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    currency VARCHAR(3) DEFAULT 'gbp',

    -- Status tracking
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, succeeded, refunded, failed
    refund_amount INTEGER DEFAULT 0,
    stripe_refund_id VARCHAR(255),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_event ON event_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON event_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_ticket ON event_payments(ticket_uuid);
CREATE INDEX IF NOT EXISTS idx_payments_registration ON event_payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_session ON event_payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON event_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON event_payments(created_at DESC);

-- Add comments
COMMENT ON TABLE event_payments IS 'Tracks all Stripe payments for event registrations';
COMMENT ON COLUMN event_payments.amount_total IS 'Total amount charged in pence (e.g., 1500 = £15.00)';
COMMENT ON COLUMN event_payments.platform_fee IS 'Platform fee amount in pence (our revenue)';
COMMENT ON COLUMN event_payments.organizer_amount IS 'Amount organizer receives in pence (after fee)';
COMMENT ON COLUMN event_payments.payment_status IS 'pending, succeeded, refunded, or failed';

-- ============================================================================
-- PHASE 3: Update event_registrations table for payment support
-- ============================================================================

ALTER TABLE event_registrations
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES event_payments(id),
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'free';

-- Index for payment lookups
CREATE INDEX IF NOT EXISTS idx_registrations_payment_id ON event_registrations(payment_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON event_registrations(payment_status);

-- Add comments
COMMENT ON COLUMN event_registrations.payment_id IS 'Links to event_payments table for paid registrations';
COMMENT ON COLUMN event_registrations.payment_required IS 'Whether this registration required payment';
COMMENT ON COLUMN event_registrations.payment_status IS 'free, pending, paid, or refunded';

-- ============================================================================
-- PHASE 4: Update tickets table data type for consistency
-- ============================================================================

-- Note: ticket_price is currently TEXT, but we're storing numeric values
-- Consider migrating to NUMERIC type in future, but for now we'll parse as integers
COMMENT ON COLUMN tickets.ticket_price IS 'Ticket price in pounds (stored as text, parse as numeric). 0 = free ticket';
COMMENT ON COLUMN tickets.price_id IS 'Stripe Price ID for paid tickets (NULL for free tickets)';
COMMENT ON COLUMN tickets.tickets_available IS 'Number of tickets available (NULL = unlimited)';

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Next steps:
-- 1. Add Stripe API keys to environment variables
-- 2. Create Stripe Connect onboarding flow in account page
-- 3. Update event creation to validate Connect account for paid tickets
-- 4. Build checkout session creation API
-- 5. Implement webhook handler for payment confirmation
-- 6. Update registration UI to support ticket selection
