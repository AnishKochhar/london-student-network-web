# Database Schema Migration Guide

## Overview

This migration fixes critical database schema issues related to foreign key relationships and data types in the `event_registrations` table.

### Issues Fixed

1. **Type Mismatch**: Fixed `event_registrations.user_id` and `event_registrations.event_id` from `VARCHAR(255)` to `UUID` to match parent tables
2. **Missing Foreign Keys**: Added proper foreign key constraints to ensure data integrity
3. **Performance**: Added relevant indexes for better query performance

### Before Migration

```sql
-- event_registrations table had these issues:
user_id VARCHAR(255)     -- Should be UUID to match users.id
event_id VARCHAR(255)    -- Should be UUID to match events.id
-- No foreign key constraints
-- No proper indexes
```

### After Migration

```sql
-- event_registrations table structure:
user_id UUID             -- Matches users.id (nullable for guests)
event_id UUID NOT NULL   -- Matches events.id
-- Foreign key constraints added
-- Performance indexes added
```

## Pre-Migration Checklist

- [ ] **Backup Database**: Create a full backup before proceeding
- [ ] **Maintenance Window**: Schedule during low traffic period
- [ ] **Test Environment**: Run migration on test database first
- [ ] **Application Downtime**: Plan for brief application downtime

## Migration Steps

### 1. Create Database Backup

```bash
# Replace with your actual connection string
pg_dump 'postgresql://user:pass@host/db' > backup_before_migration.sql
```

### 2. Run the Migration

```bash
# Execute the migration script
psql 'postgresql://default:PNJFAt8vcW7O@ep-soft-waterfall-a2qte6q3-pooler.eu-central-1.aws.neon.tech/verceldb?sslmode=require&channel_binding=require' -f migration-fix-schema.sql
```

### 3. Validate the Migration

```bash
# Run the test script to validate everything worked
psql 'postgresql://default:PNJFAt8vcW7O@ep-soft-waterfall-a2qte6q3-pooler.eu-central-1.aws.neon.tech/verceldb?sslmode=require&channel_binding=require' -f test-schema-migration.sql
```

### 4. Test Application

1. Start the application
2. Test event registration (both user and guest)
3. Test viewing registrations in admin panel
4. Verify external/internal classification works

## Rollback Procedure

If issues arise, you can rollback using:

```bash
# Only use if migration caused problems
psql 'postgresql://default:PNJFAt8vcW7O@ep-soft-waterfall-a2qte6q3-pooler.eu-central-1.aws.neon.tech/verceldb?sslmode=require&channel_binding=require' -f rollback-schema-migration.sql
```

## Expected Behavior Changes

### No Breaking Changes

- All existing application code will continue to work
- UUID values are automatically converted to/from strings
- Guest registrations (NULL user_id) remain supported

### Improved Behavior

- **Data Integrity**: Foreign key constraints prevent orphaned records
- **Performance**: New indexes improve query speed
- **Developer Experience**: Better error messages for invalid references

## Monitoring

After migration, monitor for:

- Registration errors in application logs
- Database constraint violation errors
- Performance of registration queries
- External/internal classification accuracy

## Technical Details

### Data Migration Process

1. **Safety Checks**: Validates no orphaned records exist
2. **Column Addition**: Adds new UUID columns alongside existing VARCHAR columns
3. **Data Conversion**: Converts existing VARCHAR data to UUID format
4. **Validation**: Ensures all data converted successfully
5. **Column Swap**: Drops old columns and renames new ones
6. **Constraints**: Adds foreign key constraints and indexes

### Foreign Key Constraints Added

```sql
-- User foreign key (nullable for guest registrations)
ALTER TABLE event_registrations
ADD CONSTRAINT fk_event_registrations_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Event foreign key (required)
ALTER TABLE event_registrations
ADD CONSTRAINT fk_event_registrations_event_id
FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Event organizer foreign key
ALTER TABLE events
ADD CONSTRAINT fk_events_organiser_uid
FOREIGN KEY (organiser_uid) REFERENCES users(id) ON DELETE RESTRICT;
```

### Indexes Added

```sql
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_external ON event_registrations(external);
CREATE INDEX idx_event_registrations_created_at ON event_registrations(created_at);
```

## Support

If you encounter issues:

1. Check application logs for constraint violations
2. Run the test script to validate schema state
3. Use rollback script if necessary
4. Contact development team with specific error messages

## External/Internal Registration Logic Analysis

### How It Works

The external/internal classification is determined by comparing universities:

1. **User Registration**:
   - Gets user's university from `getUserUniversityById()`
   - Gets event organizer's university
   - If universities differ → `external = true`
   - If universities match → `external = false`

2. **Guest Registration**:
   - Always marked as `external = true`
   - `user_id = NULL` for guest registrations

### University Resolution

```sql
-- getUserUniversityById() checks both tables:
SELECT COALESCE(
    (SELECT university_attended FROM user_information WHERE user_id = $1),
    (SELECT university_affiliation FROM society_information WHERE user_id = $1)
) AS university;
```

### Data Flow

1. User attempts registration
2. System looks up user's university
3. System looks up event organizer's university
4. Compares universities to set `external` flag
5. Inserts registration with proper classification

This ensures proper segregation of internal vs external attendees for reporting and communication purposes.