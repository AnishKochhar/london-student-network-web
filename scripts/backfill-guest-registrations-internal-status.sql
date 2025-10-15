-- =========================================================================
-- Backfill Script: Update Guest Registrations to Internal Status
-- =========================================================================
-- Purpose: Fix guest registrations that should be marked as "internal"
--          based on university email domain matching event organizer's university
--
-- Safety: Only updates future events (not yet run)
-- =========================================================================

-- Step 1: Show what will be updated (DRY RUN)
-- Uncomment to see affected registrations before making changes
--
-- SELECT
--     er.event_registration_uuid,
--     er.event_id,
--     er.name,
--     er.email,
--     er.external as current_status,
--     e.title as event_title,
--     e.organiser,
--     u.verified_university as organizer_university,
--     ued.university_code as email_university,
--     ued.university_name
-- FROM event_registrations er
-- JOIN events e ON er.event_id = e.id
-- JOIN users u ON e.organiser_uid = u.id
-- JOIN university_email_domains ued ON LOWER(SPLIT_PART(er.email, '@', 2)) = ued.email_domain
-- WHERE er.user_id IS NULL  -- Guest registrations only
--   AND er.external = true  -- Currently marked external
--   AND e.is_deleted = false
--   AND e.start_datetime > NOW()  -- Only future events
--   AND u.verified_university = ued.university_code  -- Email university matches organizer university
--   AND ued.is_active = true;

-- Step 2: Count affected records
SELECT COUNT(*) as records_to_update
FROM event_registrations er
JOIN events e ON er.event_id = e.id
JOIN users u ON e.organiser_uid = u.id
JOIN university_email_domains ued ON LOWER(SPLIT_PART(er.email, '@', 2)) = ued.email_domain
WHERE er.user_id IS NULL
  AND er.external = true
  AND e.is_deleted = false
  AND e.start_datetime > NOW()
  AND u.verified_university = ued.university_code
  AND ued.is_active = true;

-- Step 3: Perform the update
-- Updates guest registrations to internal where:
-- 1. Guest used a recognized university email
-- 2. University matches event organizer's university
-- 3. Event hasn't happened yet
UPDATE event_registrations
SET external = false
WHERE event_registration_uuid IN (
    SELECT er.event_registration_uuid
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id
    JOIN users u ON e.organiser_uid = u.id
    JOIN university_email_domains ued ON LOWER(SPLIT_PART(er.email, '@', 2)) = ued.email_domain
    WHERE er.user_id IS NULL
      AND er.external = true
      AND e.is_deleted = false
      AND e.start_datetime > NOW()
      AND u.verified_university = ued.university_code
      AND ued.is_active = true
);

-- Step 4: Verify results
SELECT
    COUNT(*) as total_guest_registrations,
    COUNT(CASE WHEN external = false THEN 1 END) as internal_guests,
    COUNT(CASE WHEN external = true THEN 1 END) as external_guests,
    ROUND(100.0 * COUNT(CASE WHEN external = false THEN 1 END) / COUNT(*), 2) as percent_internal
FROM event_registrations
WHERE user_id IS NULL;

-- Step 5: Show updated registrations by university
SELECT
    ued.university_name,
    COUNT(*) as registrations_updated
FROM event_registrations er
JOIN university_email_domains ued ON LOWER(SPLIT_PART(er.email, '@', 2)) = ued.email_domain
WHERE er.user_id IS NULL
  AND er.external = false
  AND ued.is_active = true
GROUP BY ued.university_name
ORDER BY registrations_updated DESC;

-- =========================================================================
-- Notes:
-- =========================================================================
-- 1. This script only affects FUTURE events (start_datetime > NOW())
-- 2. Only updates where email university = organizer university
-- 3. Safe to run multiple times (idempotent)
-- 4. Does NOT affect logged-in user registrations
-- 5. Does NOT affect past events (data integrity preserved for analytics)
--
-- Example:
-- - Event organized by Imperial College student
-- - Guest registers with john@imperial.ac.uk
-- - Result: external = false (internal)
--
-- - Event organized by Imperial College student
-- - Guest registers with jane@kcl.ac.uk
-- - Result: external = true (remains external)
-- =========================================================================
