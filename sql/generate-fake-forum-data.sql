-- Script to generate completely fake forum data with fake users
--
-- This script creates fake test users and uses them to populate the forum with realistic content.
-- All fake users use email domain @test-forum.local for easy identification and cleanup.
--
-- PREREQUISITES:
--   1. Run database-migration-add-usernames.sql first
--   2. Ensure users, usernames, threads, comments tables exist
--
-- CLEANUP:
--   To remove all fake data: DELETE FROM users WHERE email LIKE '%@test-forum.local';
--   (Cascading deletes will remove all associated data)

-- First, let's create some forum tags if they don't exist
INSERT INTO forum_tags (name) VALUES
    ('General Discussion'),
    ('Academic'),
    ('Social Events'),
    ('Career Advice'),
    ('Study Groups'),
    ('Housing'),
    ('Finance'),
    ('Technology'),
    ('Sports'),
    ('Food & Dining'),
    ('Mental Health'),
    ('Networking'),
    ('Internships'),
    ('Research'),
    ('Travel')
ON CONFLICT (name) DO NOTHING;

-- PART 1: Create 30 fake users with realistic names and usernames
DO $$
DECLARE
    fake_user_id UUID;
    fake_users_data JSONB[] := ARRAY[
        -- Format: name, username (varied styles: some with numbers, underscores, no special chars, etc.)
        '{"name": "Alex Thompson", "username": "alexthompson"}'::jsonb,
        '{"name": "Sarah Chen", "username": "sarahc92"}'::jsonb,
        '{"name": "James Wilson", "username": "jwilson2024"}'::jsonb,
        '{"name": "Emma Martinez", "username": "emma_martinez"}'::jsonb,
        '{"name": "Oliver Brown", "username": "oliverbrown123"}'::jsonb,
        '{"name": "Sophie Turner", "username": "sophiet"}'::jsonb,
        '{"name": "Mohammed Ali", "username": "mali_london"}'::jsonb,
        '{"name": "Isabella Rodriguez", "username": "isabella_r"}'::jsonb,
        '{"name": "Lucas Anderson", "username": "lucasand"}'::jsonb,
        '{"name": "Chloe Davies", "username": "chloed_uk"}'::jsonb,
        '{"name": "Daniel Kim", "username": "danielkim95"}'::jsonb,
        '{"name": "Grace O''Brien", "username": "graceob"}'::jsonb,
        '{"name": "Ryan Patel", "username": "ryanpatel22"}'::jsonb,
        '{"name": "Mia Johnson", "username": "miajohnson"}'::jsonb,
        '{"name": "Nathan Lee", "username": "nlee2023"}'::jsonb,
        '{"name": "Zoe Williams", "username": "zoe_w"}'::jsonb,
        '{"name": "Ethan Taylor", "username": "ethantaylor99"}'::jsonb,
        '{"name": "Ava Singh", "username": "avasingh"}'::jsonb,
        '{"name": "Jack Murphy", "username": "jackmurphy7"}'::jsonb,
        '{"name": "Lily Zhang", "username": "lilyzhang"}'::jsonb,
        '{"name": "Tom Roberts", "username": "troberts"}'::jsonb,
        '{"name": "Nina Kowalski", "username": "nina_k88"}'::jsonb,
        '{"name": "Ben Foster", "username": "benfoster"}'::jsonb,
        '{"name": "Rachel Green", "username": "rachelgreen21"}'::jsonb,
        '{"name": "Sam Hughes", "username": "samhughes"}'::jsonb,
        '{"name": "Katie Price", "username": "katiep_2024"}'::jsonb,
        '{"name": "Max Weber", "username": "maxweber"}'::jsonb,
        '{"name": "Amy Scott", "username": "amyscott15"}'::jsonb,
        '{"name": "Charlie Adams", "username": "charlie_adams"}'::jsonb,
        '{"name": "Jessica Liu", "username": "jliu_student"}'::jsonb
    ];
    user_data JSONB;
    email_counter INTEGER := 1;
    created_date TIMESTAMP;
BEGIN
    RAISE NOTICE 'Creating 30 fake users with realistic usernames...';

    -- Create each fake user
    FOREACH user_data IN ARRAY fake_users_data
    LOOP
        -- Generate a creation date spread over the past year
        created_date := NOW() - (random() * interval '365 days');

        -- Insert the user
        INSERT INTO users (name, email, password, role, emailVerified, created_at)
        VALUES (
            user_data->>'name',
            'testuser' || email_counter || '@test-forum.local',
            '$2a$12$fakePasswordHashForTestingOnly', -- Not a real password hash
            'user',
            true,
            created_date
        ) RETURNING id INTO fake_user_id;

        -- Insert the username
        INSERT INTO usernames (user_id, username, created_at)
        VALUES (
            fake_user_id,
            user_data->>'username',
            created_date + interval '1 day' -- Username created day after account
        );

        email_counter := email_counter + 1;
    END LOOP;

    RAISE NOTICE 'Created 30 fake users with usernames';
END $$;

-- PART 2: Generate realistic forum threads using the fake users
DO $$
DECLARE
    thread_titles TEXT[] := ARRAY[
        'Best study spots on campus?',
        'Looking for flatmates in Zone 2',
        'Anyone else struggling with Machine Learning coursework?',
        'Internship opportunities in fintech?',
        'Mental health resources at university',
        'Cheap eats near campus',
        'Study group for Advanced Algorithms',
        'Part-time job recommendations',
        'Best societies to join as a fresher',
        'Exam stress - how do you cope?',
        'Graduate scheme applications - tips?',
        'Free events happening this weekend',
        'Library opening hours during exams',
        'Networking events for CS students',
        'Budget-friendly date ideas in London',
        'PhD application advice needed',
        'Student discounts everyone should know',
        'Housing deposit problems',
        'Dissertation topic suggestions',
        'Best apps for student life',
        'Group project coordination tips',
        'Career fair experiences',
        'Gym buddy wanted for campus fitness',
        'Cooking on a student budget',
        'Time management strategies',
        'Research opportunities for undergrads',
        'Student loan questions',
        'Best places for quiet study',
        'Social anxiety at university',
        'Technology meetups in London',
        'Volunteering opportunities',
        'Academic writing tips',
        'Balancing work and studies',
        'Fresh graduate job search',
        'University accommodation review',
        'Language exchange partners',
        'Study abroad experiences',
        'Lab safety concerns',
        'Entrepreneurship at university',
        'Mental health first aid',
        'Campus food reviews',
        'Late-night study sessions',
        'Academic referencing help',
        'Student societies budget',
        'Textbook sharing',
        'Campus WiFi issues',
        'Graduation preparation',
        'Alumni networking',
        'Research paper collaboration',
        'Student rights and advocacy'
    ];

    thread_contents TEXT[] := ARRAY[
        'I''m looking for quiet places to study on campus. The library gets really crowded during exam period. Any hidden gems?',
        'Moving to London for uni and need flatmates. I''m clean, quiet, and looking for somewhere in Zone 2. Budget around £600/month.',
        'The ML coursework is killing me. Anyone else finding the neural networks assignment impossible? Maybe we could form a study group?',
        'Has anyone had success getting internships in fintech companies? Looking for advice on applications and what they look for.',
        'University can be overwhelming. What mental health resources have you found helpful? Both on-campus and external options.',
        'Student budget is tight. What are your go-to cheap food places near campus? Bonus points for healthy options.',
        'Forming a study group for Advanced Algorithms. We meet weekly to go through problem sets and past papers. DM if interested!',
        'Need to earn some money alongside studies. What part-time jobs work well with a full course load? Flexible hours preferred.',
        'So many societies at the freshers fair! Which ones are actually worth joining? Looking for both social and career development.',
        'Exam period is approaching and I''m already feeling the stress. How do you manage anxiety and stay productive?',
        'Graduate scheme deadlines are coming up. Any tips for applications? What do employers really want to see?',
        'What''s happening this weekend that won''t break the bank? Looking for free or cheap events around London.',
        'Does anyone know the extended library hours during exam period? The website seems outdated.',
        'Are there any good networking events specifically for Computer Science students? Want to build industry connections.',
        'Planning a date but student budget is tight. What are some fun, affordable things to do in London?',
        'Considering PhD applications. Current PhD students - what advice would you give? How did you choose your supervisor?',
        'Let''s share the best student discounts. I''ll start: 10% off at most restaurants with UNiDAYS.',
        'Landlord is being difficult about returning my deposit. Anyone dealt with similar issues? Know any resources?',
        'Struggling to choose a dissertation topic. What made you decide on yours? Any topics you''d recommend avoiding?',
        'What apps do you use to stay organized as a student? Looking for something better than basic calendar apps.',
        'Group projects can be a nightmare. What strategies work for keeping everyone accountable and on track?',
        'Just went to the career fair. Some interesting companies but felt unprepared. What questions should I have asked?',
        'Looking for a gym buddy for the campus fitness center. I usually go evenings and focus on strength training.',
        'Cooking for myself for the first time. What are some cheap, healthy meals that are hard to mess up?',
        'How do you manage your time effectively? Feeling overwhelmed with coursework, job applications, and social life.',
        'Interested in getting involved in research as an undergraduate. How do you approach professors about opportunities?',
        'Student loan questions are confusing. Anyone understand how the repayment system actually works?',
        'Library is too social for deep focus. Where do you go when you need absolute quiet for studying?',
        'University social events give me anxiety. Anyone else struggle with this? How do you push yourself to attend?',
        'Any good technology meetups or hackathons happening in London? Want to network and learn new skills.',
        'Looking to get involved in volunteering. What organizations do you recommend for students?',
        'Academic writing feels different from school essays. Any resources or tips for improving university-level writing?',
        'Trying to work part-time while studying full-time. How do you balance both without burning out?',
        'Recent graduate here. Job search is harder than expected. What strategies worked for you?',
        'Lived in university accommodation last year. Happy to answer questions about different halls and what to expect.',
        'Want to improve my Spanish. Anyone interested in language exchange? I can help with English.',
        'Studied abroad last semester. Amazing experience! Happy to share advice about programs and applications.',
        'Safety protocols in our lab seem outdated. Has anyone successfully raised concerns with faculty?',
        'Thinking about starting a business while at university. Anyone have experience with student entrepreneurship?',
        'Mental health first aid training was really valuable. Would recommend to anyone interested in helping others.',
        'Campus food gets repetitive. What are your favorite places to eat around university?',
        'Anyone else become a night owl during university? Best places for late-night studying?',
        'Academic referencing is so confusing. Harvard, APA, Chicago - how do you keep track of different styles?',
        'Our society budget got cut. How do other student organizations fundraise effectively?',
        'Textbooks are so expensive. Anyone interested in sharing/swapping books for next semester?',
        'Campus WiFi has been terrible lately. Is it just me or is everyone having connectivity issues?',
        'Graduation is approaching fast. What do I need to know about the ceremony and preparation?',
        'How do you maintain connections with alumni? Networking feels awkward but seems important for career prospects.',
        'Working on a research paper and could use collaboration. Anyone researching similar topics in sustainability?',
        'Know your rights as a student! What advocacy resources exist when you have issues with the university?'
    ];

    user_ids UUID[];
    tag_ids INTEGER[];
    current_user_id UUID;
    current_tag_id INTEGER;
    v_thread_id INTEGER;
    v_comment_id INTEGER;
    random_date TIMESTAMP;
    i INTEGER;
    j INTEGER;
    k INTEGER;
    comment_count INTEGER;
    reply_count INTEGER;
BEGIN
    RAISE NOTICE 'Generating forum threads from fake users...';

    -- Get all fake user IDs
    SELECT ARRAY(
        SELECT u.id
        FROM users u
        WHERE u.email LIKE '%@test-forum.local'
        ORDER BY u.created_at
    ) INTO user_ids;

    IF array_length(user_ids, 1) = 0 THEN
        RAISE EXCEPTION 'No fake users found. Please ensure Part 1 completed successfully.';
    END IF;

    -- Get available tag IDs
    SELECT ARRAY(SELECT id FROM forum_tags ORDER BY id) INTO tag_ids;

    -- Generate 50 threads
    FOR i IN 1..50 LOOP
        -- Select random fake user as author
        current_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];

        -- Generate random date in the past 6 months
        random_date := NOW() - (random() * interval '180 days');

        -- Insert thread
        BEGIN
            INSERT INTO threads (title, content, author_id, created_at, updated_at, upvotes, downvotes)
            VALUES (
                thread_titles[((i - 1) % array_length(thread_titles, 1)) + 1],
                thread_contents[((i - 1) % array_length(thread_contents, 1)) + 1],
                current_user_id,
                random_date,
                random_date,
                floor(random() * 50)::int,  -- Random upvotes 0-49
                floor(random() * 10)::int   -- Random downvotes 0-9
            ) RETURNING id INTO v_thread_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to create thread %: %', i, SQLERRM;
            CONTINUE;
        END;

        -- Add 1-3 random tags to each thread
        FOR j IN 1..(1 + floor(random() * 3)::int) LOOP
            current_tag_id := tag_ids[1 + floor(random() * array_length(tag_ids, 1))::int];
            INSERT INTO thread_tags (thread_id, forum_tag_id)
            VALUES (thread_id, current_tag_id)
            ON CONFLICT (thread_id, forum_tag_id) DO NOTHING;
        END LOOP;

        -- Generate 2-15 comments for popular threads, 0-5 for others
        IF random() < 0.3 THEN
            comment_count := floor(random() * 6)::int;  -- Less popular thread
        ELSE
            comment_count := 2 + floor(random() * 14)::int;  -- More engagement
        END IF;

        FOR j IN 1..comment_count LOOP
            -- Select a different fake user for comment
            current_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];

            -- Generate varied comment content
            DECLARE
                comment_templates TEXT[] := ARRAY[
                    'Great question! I had a similar experience when I started here.',
                    'I completely agree with this. It''s been a real challenge for me too.',
                    'Have you tried reaching out to the student services? They were really helpful for me.',
                    'Thanks for posting this. I''ve been wondering the same thing.',
                    'This is exactly what I needed to hear today. Really appreciate you sharing.',
                    'I disagree slightly - in my experience, it''s been quite different.',
                    'Following this thread! Really interested to see what others say.',
                    'Can confirm this works. I''ve been doing it for months now.',
                    'Adding to this - don''t forget to check the university website for updates.',
                    'Has anyone else noticed this problem getting worse recently?',
                    'Quick tip that might help: try scheduling your time in blocks.',
                    'I had the exact same issue last semester. Here''s what worked for me...',
                    'This is such an important topic. More people need to be talking about this.',
                    'Just wanted to say thank you for bringing this up. Really needed to see this.',
                    'Alternative perspective here - what about trying a different approach?'
                ];
            BEGIN
                INSERT INTO comments (thread_id, content, author_id, created_at, updated_at, upvotes, downvotes)
                VALUES (
                    thread_id,
                    comment_templates[1 + floor(random() * array_length(comment_templates, 1))::int] ||
                    CASE
                        WHEN random() < 0.3 THEN ' Would love to hear more thoughts on this.'
                        WHEN random() < 0.6 THEN ' Hope this helps someone!'
                        ELSE ''
                    END,
                    current_user_id,
                    random_date + (j * interval '2 hours') + (random() * interval '2 days'),
                    random_date + (j * interval '2 hours') + (random() * interval '2 days'),
                    floor(random() * 20)::int,
                    floor(random() * 5)::int
                ) RETURNING id INTO comment_id;

                -- 30% chance to add replies to comments
                IF random() < 0.3 THEN
                    reply_count := 1 + floor(random() * 2)::int;

                    FOR k IN 1..reply_count LOOP
                        current_user_id := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];

                        INSERT INTO comments (thread_id, parent_id, content, author_id, created_at, updated_at, upvotes, downvotes)
                        VALUES (
                            thread_id,
                            comment_id,
                            CASE floor(random() * 5)::int
                                WHEN 0 THEN 'Exactly this! Couldn''t have said it better.'
                                WHEN 1 THEN 'Thanks for clarifying. That makes much more sense now.'
                                WHEN 2 THEN 'Do you have a source for this? Would love to read more.'
                                WHEN 3 THEN 'This worked for me too! Can confirm.'
                                ELSE 'Good point, hadn''t thought about it that way.'
                            END,
                            current_user_id,
                            random_date + (j * interval '2 hours') + (k * interval '30 minutes') + (random() * interval '3 days'),
                            random_date + (j * interval '2 hours') + (k * interval '30 minutes') + (random() * interval '3 days'),
                            floor(random() * 10)::int,
                            floor(random() * 3)::int
                        );
                    END LOOP;
                END IF;
            END;
        END LOOP;

        -- Generate thread votes from some fake users
        FOR j IN 1..array_length(user_ids, 1) LOOP
            IF random() < 0.15 THEN  -- 15% chance each user votes
                current_user_id := user_ids[j];

                -- Don't vote on own threads
                IF current_user_id != (SELECT author_id FROM threads WHERE id = thread_id) THEN
                    INSERT INTO thread_votes (thread_id, user_id, vote_type, created_at)
                    VALUES (
                        thread_id,
                        current_user_id,
                        CASE
                            WHEN random() < 0.8 THEN 'upvote'  -- 80% upvotes
                            ELSE 'downvote'
                        END,
                        random_date + (random() * interval '30 days')
                    )
                    ON CONFLICT (thread_id, user_id) DO NOTHING;
                END IF;
            END IF;
        END LOOP;

        -- Progress logging
        IF i % 10 = 0 THEN
            RAISE NOTICE 'Generated % threads so far...', i;
        END IF;
    END LOOP;

    -- Final summary
    DECLARE
        total_threads INTEGER;
        total_comments INTEGER;
        total_replies INTEGER;
        total_fake_users INTEGER;
    BEGIN
        SELECT COUNT(*) INTO total_fake_users FROM users WHERE email LIKE '%@test-forum.local';
        SELECT COUNT(*) INTO total_threads FROM threads WHERE author_id IN (SELECT id FROM users WHERE email LIKE '%@test-forum.local');
        SELECT COUNT(*) INTO total_comments FROM comments WHERE parent_id IS NULL AND author_id IN (SELECT id FROM users WHERE email LIKE '%@test-forum.local');
        SELECT COUNT(*) INTO total_replies FROM comments WHERE parent_id IS NOT NULL AND author_id IN (SELECT id FROM users WHERE email LIKE '%@test-forum.local');

        RAISE NOTICE '';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Forum generation complete!';
        RAISE NOTICE '========================================';
        RAISE NOTICE 'Created:';
        RAISE NOTICE '  - % fake users with usernames', total_fake_users;
        RAISE NOTICE '  - % threads', total_threads;
        RAISE NOTICE '  - % top-level comments', total_comments;
        RAISE NOTICE '  - % replies', total_replies;
        RAISE NOTICE '';
        RAISE NOTICE 'To remove all fake data, run:';
        RAISE NOTICE '  DELETE FROM users WHERE email LIKE ''%%@test-forum.local'';';
        RAISE NOTICE '========================================';
    END;
END $$;