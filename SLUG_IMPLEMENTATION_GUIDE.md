# Society Slug Implementation - Setup & Testing Guide

## Overview
This implementation adds human-readable URLs for society pages (e.g., `/societies/kcl-neurotech` instead of `/societies/society/[uuid]`).

## Setup Steps

### 1. Database Migration

Run the SQL migration to add the `slug` column:

```bash
# Apply the migration from migrations/001_add_society_slugs.sql
# Connect to your PostgreSQL database and run:
psql -U your_username -d your_database -f migrations/001_add_society_slugs.sql
```

Or manually execute:
```sql
ALTER TABLE society_information ADD COLUMN IF NOT EXISTS slug VARCHAR(60);
CREATE UNIQUE INDEX IF NOT EXISTS idx_society_slug ON society_information(slug);
```

### 2. Generate Slugs for Existing Societies

Access the seed route to generate slugs for all existing societies:

```bash
# In your browser or via curl:
curl -X POST http://localhost:3000/api/seed/generate-slugs

# Or visit in browser (will be created in Phase 7):
# http://localhost:3000/api/seed/generate-slugs
```

### 3. Make Slug Column Required (After Migration)

Once all societies have slugs, make the column NOT NULL:

```sql
ALTER TABLE society_information ALTER COLUMN slug SET NOT NULL;
```

## Testing Checklist

### Basic Functionality

- [ ] **Slug Generation**
  - Visit `/register/society`
  - Enter a society name (e.g., "KCL Neurotech Society")
  - Verify slug is auto-generated in step 5 (e.g., "kcl-neurotech-society")
  - Try editing the slug manually
  - Verify validation works (min 3 chars, max 60, lowercase only, etc.)

- [ ] **New Society Page**
  - Register a new society
  - Visit `/societies/[your-slug]`
  - Verify all sections load correctly (About, Events, Contact)

- [ ] **Backward Compatibility**
  - Find an existing society UUID
  - Visit `/societies/society/[uuid]`
  - Verify it redirects to `/societies/[slug]`

- [ ] **Society Cards**
  - Visit `/societies`
  - Click on any society card
  - Verify it navigates to `/societies/[slug]` (not UUID)

- [ ] **Event Pages**
  - Visit any event at `/events/[event-id]`
  - Find the "Hosted by [Society Name]" section
  - Click the society name
  - Verify it links to `/societies/[slug]`

### Edge Cases

- [ ] **Reserved Slugs**
  - Try creating a society with slug "admin" or "api"
  - Verify validation error appears

- [ ] **Duplicate Slugs**
  - Try creating two societies with the same name
  - Verify second one gets unique slug (e.g., "kcl-neurotech-2")

- [ ] **Special Characters**
  - Create society with name "KCL: Neurotech & AI"
  - Verify slug is "kcl-neurotech-ai" (special chars removed)

- [ ] **Very Long Names**
  - Create society with 100+ character name
  - Verify slug is truncated to 60 characters

- [ ] **404 Handling**
  - Visit `/societies/non-existent-slug`
  - Verify proper 404 page shows

### API Endpoints

Test these endpoints:

```bash
# Check slug availability
curl -X POST http://localhost:3000/api/societies/check-slug \
  -H "Content-Type: application/json" \
  -d '{"slug": "kcl-neurotech"}'

# Get society by slug
curl -X POST http://localhost:3000/api/societies/get-by-slug \
  -H "Content-Type: application/json" \
  -d '{"slug": "kcl-neurotech"}'

# Get slug by organiser ID
curl -X POST http://localhost:3000/api/societies/get-slug \
  -H "Content-Type: application/json" \
  -d '{"organiser_uid": "your-uuid-here"}'
```

## Troubleshooting

### "Slug already taken" error
- Check database for duplicate slugs
- Migration script should handle this automatically

### Redirects not working
- Clear browser cache
- Check that `slug` column exists in `society_information` table
- Verify `/api/societies/get-slug` returns correct data

### Events not showing society links
- Check that `fetchEventById` and `fetchAllUpcomingEvents` include the JOIN
- Verify `organiser_slug` is in the Event type

## Rollback Plan

If you need to rollback:

```sql
-- Remove slug column
ALTER TABLE society_information DROP COLUMN IF EXISTS slug CASCADE;
DROP INDEX IF EXISTS idx_society_slug;
```

Then revert code changes via git.

## Performance Notes

- The `slug` column has a UNIQUE INDEX for fast lookups
- LEFT JOIN in event queries adds minimal overhead
- Next.js will cache society pages automatically

## Security Considerations

- Slugs are validated to prevent injection
- Reserved words list prevents route conflicts
- Unique constraint prevents slug hijacking

## Next Steps

After successful deployment:
1. Monitor for any 404 errors in production logs
2. Update any external links to use new slug-based URLs
3. Consider adding slug to sitemap.xml for SEO
4. Update analytics to track slug-based URLs

## Support

If you encounter issues:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify database migration completed successfully
4. Test with a fresh society registration

---

**Status**: Implementation complete through Phase 6
**Remaining**: Phase 7 (migration seed route) - to be added in registration form update
