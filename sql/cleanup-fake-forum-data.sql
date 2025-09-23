-- Script to remove all fake forum data
--
-- This will delete all test users and their associated data (usernames, threads, comments, votes)
-- through cascading deletes.

DO $$
DECLARE
    deleted_users INTEGER;
    deleted_threads INTEGER;
    deleted_comments INTEGER;
BEGIN
    -- Count what will be deleted for reporting
    SELECT COUNT(*) INTO deleted_threads
    FROM threads
    WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@test-forum.local');

    SELECT COUNT(*) INTO deleted_comments
    FROM comments
    WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@test-forum.local');

    -- Delete all fake users (cascading deletes will handle the rest)
    DELETE FROM users WHERE email LIKE '%@test-forum.local';
    GET DIAGNOSTICS deleted_users = ROW_COUNT;

    -- Report what was deleted
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fake forum data cleanup complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Deleted:';
    RAISE NOTICE '  - % fake users', deleted_users;
    RAISE NOTICE '  - % threads (approximately)', deleted_threads;
    RAISE NOTICE '  - % comments (approximately)', deleted_comments;
    RAISE NOTICE '';
    RAISE NOTICE 'All associated data (usernames, votes, etc.) was also removed via cascading deletes.';
    RAISE NOTICE '========================================';
END $$;