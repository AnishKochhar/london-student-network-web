-- Script to generate realistic forum data for testing
--
-- This script creates 50 threads with comments, replies, tags, and votes using EXISTING users.
-- No fake users are created - it uses your real user accounts and generates usernames for them.
--
-- PREREQUISITES:
--   1. Run database-migration-add-usernames.sql first
--   2. Have at least 3 real users in your users table
--
-- WHAT THIS SCRIPT DOES:
--   1. Creates realistic usernames for existing users (based on their role)
--   2. Generates 50 diverse forum threads with realistic content
--   3. Creates 2-15 comments per thread with realistic responses
--   4. Adds nested replies (30% chance, 1-3 replies per comment)
--   5. Generates realistic voting patterns
--   6. Assigns 1-3 tags per thread from available categories
--
-- The generated content simulates a real student forum with discussions about:
-- academics, housing, career advice, social events, mental health, technology, etc.

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

-- Create realistic usernames for existing users based on their role and name
DO $$
DECLARE
    user_record RECORD;
    username_counter INTEGER := 1;
    base_username TEXT;
    final_username TEXT;
    username_variants TEXT[] := ARRAY['', '123', '2024', '01', '_uk', '_london'];
    variant_index INTEGER;
BEGIN
    RAISE NOTICE 'Creating usernames for existing users...';

    -- Create usernames for existing users (limit to first 30 users for demo)
    FOR user_record IN
        SELECT id, name, role FROM users
        WHERE role IN ('user', 'organiser', 'company')
        ORDER BY created_at
        LIMIT 30
    LOOP
        -- Skip if user already has a username
        IF EXISTS (SELECT 1 FROM usernames WHERE user_id = user_record.id) THEN
            CONTINUE;
        END IF;

        -- Generate username based on role
        IF user_record.role = 'user' THEN
            -- For regular users: create typical social media style usernames
            IF user_record.name IS NOT NULL AND user_record.name != '' THEN
                -- Extract first and potentially last name
                base_username := regexp_replace(
                    regexp_replace(lower(user_record.name), '[^a-z0-9 ]', '', 'g'),
                    '\s+', '', 'g'
                );

                -- Try different variations until we find an available one
                variant_index := 1;
                LOOP
                    IF variant_index <= array_length(username_variants, 1) THEN
                        final_username := base_username || username_variants[variant_index];
                    ELSE
                        final_username := base_username || (username_counter + variant_index - array_length(username_variants, 1));
                    END IF;

                    -- Ensure username is between 3-30 characters
                    IF length(final_username) < 3 THEN
                        final_username := final_username || username_counter;
                    ELSIF length(final_username) > 30 THEN
                        final_username := left(final_username, 27) || username_counter;
                    END IF;

                    -- Try to insert, break if successful
                    BEGIN
                        INSERT INTO usernames (user_id, username)
                        VALUES (user_record.id, final_username);
                        EXIT; -- Success, exit loop
                    EXCEPTION WHEN unique_violation THEN
                        variant_index := variant_index + 1;
                        IF variant_index > 20 THEN -- Prevent infinite loop
                            final_username := 'user' || username_counter;
                            INSERT INTO usernames (user_id, username)
                            VALUES (user_record.id, final_username);
                            EXIT;
                        END IF;
                    END;
                END LOOP;
            ELSE
                final_username := 'user' || username_counter;
                INSERT INTO usernames (user_id, username)
                VALUES (user_record.id, final_username)
                ON CONFLICT (user_id) DO NOTHING;
            END IF;
        ELSE
            -- For organiser/company: use their full name (allows spaces and longer length)
            final_username := COALESCE(user_record.name, 'Organisation ' || username_counter);

            -- Ensure it's within length limits (up to 100 chars for orgs)
            IF length(final_username) > 100 THEN
                final_username := left(final_username, 100);
            END IF;

            INSERT INTO usernames (user_id, username)
            VALUES (user_record.id, final_username)
            ON CONFLICT (user_id) DO NOTHING;
        END IF;

        username_counter := username_counter + 1;

        -- Log progress
        IF username_counter % 10 = 0 THEN
            RAISE NOTICE 'Created % usernames so far...', username_counter - 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'Finished creating usernames. Total processed: %', username_counter - 1;
END $$;

-- Generate realistic thread titles and content
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
    thread_id INTEGER;
    comment_id INTEGER;
    random_date TIMESTAMP;
    i INTEGER;
    j INTEGER;
    comment_count INTEGER;
    reply_count INTEGER;
    upvote_chance NUMERIC;
    downvote_chance NUMERIC;
BEGIN
    -- Get available user IDs that have usernames (use all available users)
    SELECT ARRAY(
        SELECT DISTINCT u.user_id
        FROM usernames u
        ORDER BY u.created_at
    ) INTO user_ids;

    -- Check if we have enough users
    IF array_length(user_ids, 1) < 3 THEN
        RAISE EXCEPTION 'Need at least 3 users with usernames to generate realistic forum data. Found: %', array_length(user_ids, 1);
    END IF;

    RAISE NOTICE 'Found % users with usernames for forum generation', array_length(user_ids, 1);

    -- Get available tag IDs
    SELECT ARRAY(SELECT id FROM forum_tags ORDER BY id) INTO tag_ids;

    IF array_length(tag_ids, 1) = 0 THEN
        RAISE EXCEPTION 'No forum tags found. Please ensure forum_tags table has data.';
    END IF;

    -- Generate 50 threads
    FOR i IN 1..50 LOOP
        -- Select random user
        current_user_id := user_ids[1 + (random() * (array_length(user_ids, 1) - 1))::int];

        -- Generate random date in the past 6 months
        random_date := NOW() - (random() * interval '180 days');

        -- Insert thread
        INSERT INTO threads (title, content, author_id, created_at, updated_at, upvotes, downvotes)
        VALUES (
            thread_titles[i],
            thread_contents[i],
            current_user_id,
            random_date,
            random_date,
            floor(random() * 50)::int,  -- Random upvotes 0-49
            floor(random() * 10)::int   -- Random downvotes 0-9
        ) RETURNING id INTO thread_id;

        -- Add 1-3 random tags to each thread
        FOR j IN 1..(1 + floor(random() * 3)::int) LOOP
            current_tag_id := tag_ids[1 + (random() * (array_length(tag_ids, 1) - 1))::int];
            INSERT INTO thread_tags (thread_id, forum_tag_id)
            VALUES (thread_id, current_tag_id)
            ON CONFLICT (thread_id, forum_tag_id) DO NOTHING;
        END LOOP;

        -- Generate 2-15 comments for each thread
        comment_count := 2 + floor(random() * 14)::int;

        FOR j IN 1..comment_count LOOP
            current_user_id := user_ids[1 + (random() * (array_length(user_ids, 1) - 1))::int];

            -- Insert comment
            INSERT INTO comments (thread_id, content, author_id, created_at, updated_at, upvotes, downvotes)
            VALUES (
                thread_id,
                'This is a sample comment response to discuss the topic further. ' ||
                CASE floor(random() * 5)::int
                    WHEN 0 THEN 'I completely agree with your perspective on this.'
                    WHEN 1 THEN 'Have you considered this alternative approach?'
                    WHEN 2 THEN 'Great question! I had a similar experience recently.'
                    WHEN 3 THEN 'Thanks for sharing this, very helpful information.'
                    ELSE 'Interesting point, would love to hear more details.'
                END,
                current_user_id,
                random_date + (random() * interval '7 days'),
                random_date + (random() * interval '7 days'),
                floor(random() * 20)::int,  -- Random upvotes
                floor(random() * 5)::int    -- Random downvotes
            ) RETURNING id INTO comment_id;

            -- 30% chance to add 1-3 replies to each comment
            IF random() < 0.3 THEN
                reply_count := 1 + floor(random() * 3)::int;

                FOR k IN 1..reply_count LOOP
                    current_user_id := user_ids[1 + (random() * (array_length(user_ids, 1) - 1))::int];

                    INSERT INTO comments (thread_id, parent_id, content, author_id, created_at, updated_at, upvotes, downvotes)
                    VALUES (
                        thread_id,
                        comment_id,
                        'This is a reply to the above comment. ' ||
                        CASE floor(random() * 4)::int
                            WHEN 0 THEN 'Good point, thanks for clarifying!'
                            WHEN 1 THEN 'I disagree, here''s why...'
                            WHEN 2 THEN 'Can you elaborate on that?'
                            ELSE 'Exactly what I was thinking!'
                        END,
                        current_user_id,
                        random_date + (random() * interval '10 days'),
                        random_date + (random() * interval '10 days'),
                        floor(random() * 10)::int,
                        floor(random() * 3)::int
                    );
                END LOOP;
            END IF;
        END LOOP;

        -- Generate some thread votes (20% of users vote on each thread)
        FOR j IN 1..array_length(user_ids, 1) LOOP
            IF random() < 0.2 THEN  -- 20% chance each user votes
                current_user_id := user_ids[j];

                -- Avoid voting on own threads
                IF current_user_id != (SELECT author_id FROM threads WHERE id = thread_id) THEN
                    INSERT INTO thread_votes (thread_id, user_id, vote_type, created_at)
                    VALUES (
                        thread_id,
                        current_user_id,
                        CASE
                            WHEN random() < 0.8 THEN 'upvote'  -- 80% upvotes, 20% downvotes
                            ELSE 'downvote'
                        END,
                        random_date + (random() * interval '30 days')
                    )
                    ON CONFLICT (thread_id, user_id) DO NOTHING;
                END IF;
            END IF;
        END LOOP;

        -- Log progress every 10 threads
        IF i % 10 = 0 THEN
            RAISE NOTICE 'Generated % threads so far...', i;
        END IF;
    END LOOP;

    -- Final summary
    DECLARE
        total_threads INTEGER;
        total_comments INTEGER;
        total_replies INTEGER;
    BEGIN
        SELECT COUNT(*) INTO total_threads FROM threads;
        SELECT COUNT(*) INTO total_comments FROM comments WHERE parent_id IS NULL;
        SELECT COUNT(*) INTO total_replies FROM comments WHERE parent_id IS NOT NULL;

        RAISE NOTICE 'Forum generation complete!';
        RAISE NOTICE 'Summary:';
        RAISE NOTICE '  - Total threads: %', total_threads;
        RAISE NOTICE '  - Total top-level comments: %', total_comments;
        RAISE NOTICE '  - Total replies: %', total_replies;
        RAISE NOTICE '  - Used % different users', array_length(user_ids, 1);
        RAISE NOTICE '  - Used % different tags', array_length(tag_ids, 1);
    END;
END $$;