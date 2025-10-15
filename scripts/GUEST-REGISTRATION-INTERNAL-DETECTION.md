# Guest Registration Internal Detection

## Overview

Guest registrations now automatically detect university emails and mark them as "internal" when the email's university matches the event organizer's university.

## How It Works

### Detection Logic

```
Guest registers with: john.doe@imperial.ac.uk
Event organized by: Imperial College student
Result: internal = true ✅

Guest registers with: jane@kcl.ac.uk
Event organized by: Imperial College student
Result: external = true (stays external) ❌

Guest registers with: bob@gmail.com
Event organized by: Any university
Result: external = true (stays external) ❌
```

### Server-Side Security

- ✅ University domains fetched from `university_email_domains` table (not exposed to client)
- ✅ Uses organizer's verified university (`verified_university` field)
- ✅ Only active domains recognized (`is_active = true`)
- ✅ Safe fallback: defaults to external on any error

### Access Control (Already in Place)

- ✅ Guest registration BLOCKED for `university_exclusive` events
- ✅ Guest registration BLOCKED for `verified_students` events
- ✅ Guest registration BLOCKED for `students_only` events
- ✅ Guest registration ONLY allowed for `public` events

**Therefore**: No security risk from marking guests as internal - they can't access restricted events anyway.

## Database Schema

### Tables Used

```sql
-- Guest registration
event_registrations (
    event_id,
    user_id,      -- NULL for guests
    email,        -- Guest's email
    external      -- true = external, false = internal
)

-- University domain mapping
university_email_domains (
    email_domain,        -- e.g., "imperial.ac.uk"
    university_code,     -- e.g., "imperial"
    university_name,     -- e.g., "Imperial College London"
    is_active           -- true = recognized
)

-- Event organizer's university
users (
    id,                 -- Organizer ID
    verified_university -- e.g., "imperial"
)

-- Event info
events (
    organiser_uid,      -- Links to users.id
    registration_level  -- 'public', 'students_only', etc.
)
```

## Backwards Compatibility Script

### Purpose

Fix historical guest registrations that should have been marked internal.

### What It Does

Updates `external = false` for guest registrations where:
1. ✅ Guest used a recognized university email
2. ✅ Email university matches organizer's university
3. ✅ Event hasn't happened yet (future events only)

### Safety

- Only affects **future events** (`start_datetime > NOW()`)
- Does NOT change past event data (preserves analytics)
- Idempotent (safe to run multiple times)
- Does NOT affect logged-in user registrations

### How to Run

```bash
# Connect to your database
psql $POSTGRES_URL

# Run the script
\i scripts/backfill-guest-registrations-internal-status.sql
```

### Expected Output

```
-- Before
Total Guest Registrations: 500
Internal: 100 (20%)
External: 400 (80%)

-- After (example)
Total Guest Registrations: 500
Internal: 250 (50%)  ← Updated!
External: 250 (50%)

Records Updated: 150
```

## Benefits for Organizers

### Before

```
Registration List for Imperial Event:
❌ All guests marked "External" (even if john@imperial.ac.uk)
❌ Hard to distinguish actual Imperial students
❌ Confusing for organizers
```

### After

```
Registration List for Imperial Event:
✅ john@imperial.ac.uk → Internal
✅ jane@imperial.ac.uk → Internal
✅ bob@gmail.com → External
✅ alice@kcl.ac.uk → External
✅ Clear distinction for organizers
```

## User Experience

### Guest Form (No Changes)

```
┌────────────────────────────────┐
│ Register for Event             │
├────────────────────────────────┤
│ First Name: [        ]         │
│ Last Name:  [        ]         │
│ Email:      [        ]         │
│             ↑                  │
│    Uses this to detect         │
│    university automatically    │
├────────────────────────────────┤
│         [ Register ]           │
└────────────────────────────────┘
```

**No UI changes needed** - detection happens server-side automatically.

### Optional Enhancement (Future)

Could add subtle hint in email field:

```html
<input
  type="email"
  placeholder="your.email@example.com"
  aria-label="Email address (use your university email if you have one)"
/>
```

But **NOT required** - works perfectly without any frontend changes.

## Technical Implementation

### Query Performance

```sql
-- Single query per registration (fast)
SELECT
    ued.university_code,
    u.verified_university
FROM university_email_domains ued
CROSS JOIN users u
WHERE u.id = ${event.organiser_uid}
  AND ued.email_domain = ${emailDomain}
  AND ued.is_active = true
```

**Index Recommendations** (if not already present):
```sql
CREATE INDEX IF NOT EXISTS idx_university_domains_email
ON university_email_domains(email_domain) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_users_verified_university
ON users(verified_university) WHERE verified_university IS NOT NULL;
```

### Error Handling

```typescript
try {
  // Check university
  isInternal = checkLogic();
} catch (error) {
  console.error('Error checking university:', error);
  isInternal = false; // Safe fallback: treat as external
  // Registration continues normally
}
```

**Safe behavior**: If anything goes wrong, guest is marked external (conservative approach).

## Testing Checklist

### Manual Tests

- [ ] Guest with `@imperial.ac.uk` registers for Imperial event → internal
- [ ] Guest with `@imperial.ac.uk` registers for UCL event → external
- [ ] Guest with `@gmail.com` registers for any event → external
- [ ] Guest with unrecognized `.ac.uk` → external
- [ ] Guest with malformed email → external (safe fallback)
- [ ] Organizer receives email with correct internal/external label

### Database Tests

- [ ] Run backfill script on test data
- [ ] Verify only future events affected
- [ ] Verify count of updated records matches expectations
- [ ] Verify internal/external distribution looks reasonable

### Access Control Tests (Should Already Pass)

- [ ] Guest CANNOT register for `university_exclusive` event
- [ ] Guest CANNOT register for `verified_students` event
- [ ] Guest CAN register for `public` event
- [ ] Internal/external status doesn't bypass restrictions

## Monitoring

### Logs to Watch

```bash
# Successful internal detection
[GUEST-REG] Guest john@imperial.ac.uk recognized as internal (Imperial College London)

# University check errors (investigate if frequent)
[GUEST-REG] Error checking university status: ...
```

### Metrics to Track

```sql
-- Internal guest percentage (should be 30-60% for typical university events)
SELECT
  COUNT(CASE WHEN external = false THEN 1 END) * 100.0 / COUNT(*) as internal_pct
FROM event_registrations
WHERE user_id IS NULL;

-- Most common university domains in guest registrations
SELECT
  SPLIT_PART(email, '@', 2) as domain,
  COUNT(*) as registrations,
  COUNT(CASE WHEN external = false THEN 1 END) as internal_count
FROM event_registrations
WHERE user_id IS NULL
GROUP BY domain
ORDER BY registrations DESC
LIMIT 10;
```

## FAQ

### Q: What about alumni emails?

**A:** Alumni with `@university.ac.uk` emails are marked internal. This is acceptable because:
- They're still affiliated with the university
- Most events welcome alumni
- Organizers can manually manage edge cases

### Q: What about staff/faculty?

**A:** Same as alumni - marked internal if domain matches. This is generally correct behavior.

### Q: What about .edu domains (US universities)?

**A:** Currently **NOT supported**. Only `.ac.uk` domains recognized. This is intentional - focus on London universities.

**To add .edu support later:**
1. Add `.edu` domains to `university_email_domains` table
2. Define which US universities are "internal" vs "external" to your network
3. No code changes needed - uses same logic

### Q: Can this be gamed/spoofed?

**A:** Yes, guests can use any email without verification. However:
- Guests can only register for PUBLIC events (no restricted access)
- Internal status is just for organizer convenience (categorization)
- If verification needed, create an account (which has email verification)

This is a **trust-based convenience feature**, not a security control.

### Q: What if organizer has no verified_university?

**A:** All guests marked external (safe default). Organizers should verify their university email to use this feature.

## Summary

✅ **Secure**: Server-side only, no client exposure
✅ **Safe**: Defaults to external on errors
✅ **Fast**: Single query per registration
✅ **Backwards compatible**: Script fixes historical data
✅ **Zero UX changes**: Works transparently
✅ **Organizer benefit**: Better registration categorization
