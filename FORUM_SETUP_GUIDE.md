# Forum Setup Guide

This guide walks you through setting up the forum with usernames and generating realistic test data.

## Prerequisites

1. **Existing Users**: You need at least 3 real users in your `users` table
2. **Database Access**: Ability to run SQL scripts on your PostgreSQL database

## Step 1: Create the Username System

Run the database migration to create the usernames table and validation:

```bash
psql "your_connection_string" -f database-migration-add-usernames.sql
```

This creates:
- `usernames` table with role-based validation
- Triggers for automatic username format validation
- Indexes for performance

## Step 2: Generate Forum Data

Run the forum data generation script:

```bash
psql "your_connection_string" -f generate-forum-data.sql
```

This will:
1. **Create usernames** for existing users:
   - **Regular users**: Get social media style usernames (e.g., `johnsmith123`, `sarah_uk`)
   - **Organisers/Companies**: Use their full name (e.g., `Imperial College Neurotech Society`)

2. **Generate 50 realistic threads** covering topics like:
   - Study spots and academic help
   - Housing and flatmate searches
   - Career advice and internships
   - Mental health and wellbeing
   - Social events and networking
   - Technology and student life

3. **Create realistic engagement**:
   - 2-15 comments per thread
   - Nested replies (30% chance)
   - Voting patterns with realistic distributions
   - Tags assigned to categorize discussions

## Step 3: Verify the Setup

Check that everything worked:

```sql
-- Check username creation
SELECT COUNT(*) as users_with_usernames FROM usernames;

-- Check forum content
SELECT COUNT(*) as total_threads FROM threads;
SELECT COUNT(*) as total_comments FROM comments WHERE parent_id IS NULL;
SELECT COUNT(*) as total_replies FROM comments WHERE parent_id IS NOT NULL;

-- See some sample data
SELECT
    t.title,
    un.username as author,
    u.role as author_role,
    t.upvotes,
    t.created_at
FROM threads t
JOIN users u ON t.author_id = u.id
JOIN usernames un ON u.id = un.user_id
ORDER BY t.created_at DESC
LIMIT 10;
```

## What You'll See

After running the scripts, your forum will display:
- **@username** format for all posts and comments
- **Mixed user types**: Regular users with short usernames, organisations with full names
- **Realistic content**: Discussions that feel like a real student forum
- **Proper engagement**: Comments, replies, and voting patterns
- **Tagged content**: Posts organized by relevant categories

## Troubleshooting

**"Need at least 3 users with usernames"**
- Make sure you have users in your `users` table
- Check that the username creation section completed successfully

**"No forum tags found"**
- The script should create tags automatically
- Verify the `forum_tags` table exists and has data

**Username validation errors**
- Check that the migration script ran completely
- Verify the trigger functions were created properly

## Customization

You can customize the generated data by editing `generate-forum-data.sql`:
- **Number of threads**: Change the loop limit (currently 50)
- **Thread content**: Modify the `thread_titles` and `thread_contents` arrays
- **Comment patterns**: Adjust the comment generation logic
- **Tags**: Add or modify the forum tags list
- **User selection**: Change the user limit or filtering criteria

The script is designed to be re-runnable and will skip creating usernames for users who already have them.