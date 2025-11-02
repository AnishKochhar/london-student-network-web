-- Script to reset Stripe Connect account for a user
-- This allows them to create a new Connect account

-- First, check current status
SELECT
    id,
    email,
    name,
    stripe_connect_account_id,
    stripe_onboarding_complete
FROM users
WHERE id = '175e2362-3aad-44e4-bf93-5177196815f6';

-- To reset (uncomment and run):
-- UPDATE users
-- SET
--     stripe_connect_account_id = NULL,
--     stripe_onboarding_complete = false,
--     stripe_charges_enabled = false,
--     stripe_payouts_enabled = false,
--     stripe_details_submitted = false
-- WHERE id = '175e2362-3aad-44e4-bf93-5177196815f6';
