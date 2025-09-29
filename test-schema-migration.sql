-- Test Script: Validate Schema Migration
-- This script validates that the migration worked correctly

-- Test 1: Check that foreign keys are working
\echo '=== Testing Foreign Key Constraints ==='

-- Test valid foreign key insertion (should work)
BEGIN;
DO $$
DECLARE
    test_user_id UUID;
    test_event_id UUID;
BEGIN
    -- Get a valid user and event for testing
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_event_id FROM events LIMIT 1;

    IF test_user_id IS NULL OR test_event_id IS NULL THEN
        RAISE EXCEPTION 'No test data available. Please ensure users and events exist.';
    END IF;

    -- Try to insert a valid registration
    INSERT INTO event_registrations (event_id, user_id, name, email, external)
    VALUES (test_event_id, test_user_id, 'Test User', 'test@example.com', false);

    -- Clean up test data
    DELETE FROM event_registrations WHERE email = 'test@example.com';

    RAISE NOTICE 'SUCCESS: Valid foreign key insertion works correctly';
END $$;
ROLLBACK;

-- Test 2: Check that invalid foreign keys are rejected
\echo '=== Testing Foreign Key Constraint Violations ==='

-- Test invalid event_id (should fail)
BEGIN;
DO $$
BEGIN
    BEGIN
        INSERT INTO event_registrations (event_id, user_id, name, email, external)
        VALUES (uuid_generate_v4(), NULL, 'Test User', 'test@example.com', true);
        RAISE EXCEPTION 'ERROR: Invalid event_id was allowed';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'SUCCESS: Invalid event_id correctly rejected';
    END;
END $$;
ROLLBACK;

-- Test invalid user_id (should fail)
BEGIN;
DO $$
DECLARE
    test_event_id UUID;
BEGIN
    SELECT id INTO test_event_id FROM events LIMIT 1;

    BEGIN
        INSERT INTO event_registrations (event_id, user_id, name, email, external)
        VALUES (test_event_id, uuid_generate_v4(), 'Test User', 'test@example.com', false);
        RAISE EXCEPTION 'ERROR: Invalid user_id was allowed';
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'SUCCESS: Invalid user_id correctly rejected';
    END;
END $$;
ROLLBACK;

-- Test 3: Check data integrity
\echo '=== Testing Data Integrity ==='

DO $$
DECLARE
    total_registrations INTEGER;
    registrations_with_valid_events INTEGER;
    registrations_with_valid_users INTEGER;
    guest_registrations INTEGER;
BEGIN
    -- Count total registrations
    SELECT COUNT(*) INTO total_registrations FROM event_registrations;

    -- Count registrations with valid event references
    SELECT COUNT(*) INTO registrations_with_valid_events
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id;

    -- Count registrations with valid user references (excluding guest registrations)
    SELECT COUNT(*) INTO registrations_with_valid_users
    FROM event_registrations er
    WHERE er.user_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM users u WHERE u.id = er.user_id);

    -- Count guest registrations (NULL user_id)
    SELECT COUNT(*) INTO guest_registrations
    FROM event_registrations
    WHERE user_id IS NULL;

    RAISE NOTICE 'Total registrations: %', total_registrations;
    RAISE NOTICE 'Registrations with valid events: %', registrations_with_valid_events;
    RAISE NOTICE 'Registrations with valid users: %', registrations_with_valid_users;
    RAISE NOTICE 'Guest registrations: %', guest_registrations;

    IF registrations_with_valid_events != total_registrations THEN
        RAISE EXCEPTION 'Data integrity error: Not all registrations have valid event references';
    END IF;

    IF (registrations_with_valid_users + guest_registrations) != total_registrations THEN
        RAISE EXCEPTION 'Data integrity error: Invalid user references found';
    END IF;

    RAISE NOTICE 'SUCCESS: All data integrity checks passed';
END $$;

-- Test 4: Check external/internal logic
\echo '=== Testing External/Internal Logic ==='

DO $$
DECLARE
    internal_count INTEGER;
    external_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT
        COUNT(CASE WHEN external = false THEN 1 END),
        COUNT(CASE WHEN external = true THEN 1 END),
        COUNT(*)
    INTO internal_count, external_count, total_count
    FROM event_registrations;

    RAISE NOTICE 'Internal registrations: %', internal_count;
    RAISE NOTICE 'External registrations: %', external_count;
    RAISE NOTICE 'Total registrations: %', total_count;

    IF (internal_count + external_count) != total_count THEN
        RAISE EXCEPTION 'External/Internal logic error: Counts do not add up';
    END IF;

    RAISE NOTICE 'SUCCESS: External/Internal logic working correctly';
END $$;

-- Test 5: Check that the application queries still work
\echo '=== Testing Application Query Compatibility ==='

DO $$
DECLARE
    test_event_id UUID;
    reg_count INTEGER;
BEGIN
    -- Get a test event
    SELECT id INTO test_event_id FROM events LIMIT 1;

    IF test_event_id IS NULL THEN
        RAISE NOTICE 'SKIPPED: No events available for testing';
        RETURN;
    END IF;

    -- Test the getRegistrationsForEvent query pattern
    SELECT COUNT(*) INTO reg_count
    FROM event_registrations
    WHERE event_id = test_event_id;

    -- Test the external/internal stats query pattern
    PERFORM
        COUNT(CASE WHEN external = false THEN 1 END) as internal,
        COUNT(CASE WHEN external = true THEN 1 END) as external
    FROM event_registrations
    WHERE event_id = test_event_id;

    RAISE NOTICE 'SUCCESS: Application queries work correctly';
END $$;

\echo '=== Schema Migration Validation Complete ==='
\echo 'If all tests show SUCCESS, the migration was successful!'

-- Display final schema for verification
\echo '=== Final Schema ==='
\d event_registrations