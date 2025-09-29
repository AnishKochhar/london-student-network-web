-- Rollback Script: Revert Schema Changes
-- This script reverts the schema migration if needed

-- WARNING: This will revert all changes made by the migration script.
-- Use only if the migration caused issues.

BEGIN;

-- Step 1: Remove foreign key constraints
ALTER TABLE event_registrations
DROP CONSTRAINT IF EXISTS fk_event_registrations_user_id;

ALTER TABLE event_registrations
DROP CONSTRAINT IF EXISTS fk_event_registrations_event_id;

ALTER TABLE events
DROP CONSTRAINT IF EXISTS fk_events_organiser_uid;

-- Step 2: Remove indexes added during migration
DROP INDEX IF EXISTS idx_event_registrations_user_id;
DROP INDEX IF EXISTS idx_event_registrations_event_id;
DROP INDEX IF EXISTS idx_event_registrations_external;
DROP INDEX IF EXISTS idx_event_registrations_created_at;

-- Step 3: Convert columns back to VARCHAR
-- Add temporary columns
ALTER TABLE event_registrations
ADD COLUMN user_id_old VARCHAR(255),
ADD COLUMN event_id_old VARCHAR(255);

-- Convert data back
UPDATE event_registrations
SET user_id_old = CASE
    WHEN user_id IS NOT NULL THEN user_id::TEXT
    ELSE NULL
END;

UPDATE event_registrations
SET event_id_old = event_id::TEXT;

-- Drop UUID columns
ALTER TABLE event_registrations
DROP COLUMN user_id,
DROP COLUMN event_id;

-- Rename columns back
ALTER TABLE event_registrations
RENAME COLUMN user_id_old TO user_id;

ALTER TABLE event_registrations
RENAME COLUMN event_id_old TO event_id;

-- Restore NOT NULL constraint on event_id
ALTER TABLE event_registrations
ALTER COLUMN event_id SET NOT NULL;

COMMIT;

\echo 'Rollback completed. Schema reverted to original state.'
\d event_registrations