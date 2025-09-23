-- Test script to verify the username migration works correctly
-- Run this AFTER running database-migration-add-usernames.sql

-- Test 1: Create test users if they don't exist
-- You may need to adjust this based on your actual users table structure
DO $$
BEGIN
    -- Create a test 'user' account if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'test.user@example.com') THEN
        INSERT INTO users (name, email, password, role, emailVerified)
        VALUES ('Test User', 'test.user@example.com', 'hashed_password', 'user', true);
    END IF;

    -- Create a test 'organiser' account if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'test.org@example.com') THEN
        INSERT INTO users (name, email, password, role, emailVerified)
        VALUES ('Imperial College Neurotech Society', 'test.org@example.com', 'hashed_password', 'organiser', true);
    END IF;
END $$;

-- Test 2: Valid username for regular user (should succeed)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test.user@example.com';

    -- Try to insert a valid username for regular user
    INSERT INTO usernames (user_id, username)
    VALUES (test_user_id, 'TestUser123')
    ON CONFLICT (user_id) DO UPDATE SET username = 'TestUser123';

    RAISE NOTICE 'SUCCESS: Created username "TestUser123" for regular user';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR creating username for regular user: %', SQLERRM;
END $$;

-- Test 3: Valid username for organiser with spaces (should succeed)
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    SELECT id INTO test_org_id FROM users WHERE email = 'test.org@example.com';

    -- Try to insert a valid username with spaces for organiser
    INSERT INTO usernames (user_id, username)
    VALUES (test_org_id, 'Imperial College Neurotech Society')
    ON CONFLICT (user_id) DO UPDATE SET username = 'Imperial College Neurotech Society';

    RAISE NOTICE 'SUCCESS: Created username "Imperial College Neurotech Society" for organiser';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR creating username for organiser: %', SQLERRM;
END $$;

-- Test 4: Invalid username for regular user with spaces (should fail)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test.user@example.com';

    -- Try to insert an invalid username with spaces for regular user
    UPDATE usernames SET username = 'Test User 123' WHERE user_id = test_user_id;

    RAISE NOTICE 'ERROR: Should not have allowed spaces in regular user username!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'EXPECTED ERROR for regular user with spaces: %', SQLERRM;
END $$;

-- Test 5: Invalid username with leading underscore (should fail for regular user)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE email = 'test.user@example.com';

    -- Try to insert an invalid username starting with underscore
    UPDATE usernames SET username = '_TestUser' WHERE user_id = test_user_id;

    RAISE NOTICE 'ERROR: Should not have allowed leading underscore!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'EXPECTED ERROR for leading underscore: %', SQLERRM;
END $$;

-- Show final results
SELECT
    u.email,
    u.role,
    un.username,
    LENGTH(un.username) as username_length
FROM users u
JOIN usernames un ON u.id = un.user_id
WHERE u.email IN ('test.user@example.com', 'test.org@example.com')
ORDER BY u.role;

-- Clean up test data (optional - uncomment if you want to remove test data)
-- DELETE FROM usernames WHERE user_id IN (SELECT id FROM users WHERE email IN ('test.user@example.com', 'test.org@example.com'));
-- DELETE FROM users WHERE email IN ('test.user@example.com', 'test.org@example.com');