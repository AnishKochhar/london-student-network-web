-- Add registration cutoff fields to events table
-- Allows organisers to set deadlines for registration before events

ALTER TABLE events
ADD COLUMN IF NOT EXISTS registration_cutoff_hours INTEGER,
ADD COLUMN IF NOT EXISTS external_registration_cutoff_hours INTEGER;

-- Add comments for clarity
COMMENT ON COLUMN events.registration_cutoff_hours IS 'Hours before event start when ALL registrations close (NULL = no cutoff)';
COMMENT ON COLUMN events.external_registration_cutoff_hours IS 'Hours before event start when EXTERNAL registrations close (NULL = no cutoff, defaults to registration_cutoff_hours if set)';

-- Example usage:
-- registration_cutoff_hours = 24: All registrations close 24 hours before event
-- external_registration_cutoff_hours = 48: External users must register 48 hours before, internal users have 24 hours
-- Both NULL: No registration cutoffs
