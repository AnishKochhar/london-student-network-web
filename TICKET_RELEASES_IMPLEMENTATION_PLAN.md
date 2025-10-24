# Ticket Releases Implementation Plan

## ✅ Completed

### 1. UI/UX Improvements
- **Fixed**: Modal click bug (closes only on backdrop click)
- **Redesigned**: Luma-inspired ticket selection with:
  - Radio button selection (cleaner than card buttons)
  - Sold out states with disabled styling
  - Low stock warnings ("Only 5 left!")
  - Better mobile responsiveness
  - Smooth hover/focus states

### 2. Performance Optimizations
- **Optimized**: Event fetching now includes:
  - ✅ Tickets data (1 API call instead of 2)
  - ✅ Registration status (no separate check needed)
  - ✅ All data loaded on page load
- **Result**: Button works immediately, no race conditions

### 3. Database Schema for Releases
- **Created**: Migration `007_add_ticket_releases.sql`
- **Fields Added** to `tickets` table:
  ```sql
  release_name VARCHAR(255)           -- "Early Bird", "1st Release"
  release_start_time TIMESTAMPTZ      -- When available
  release_end_time TIMESTAMPTZ        -- When unavailable
  release_order INTEGER               -- Display order
  ```
- **Helper Function**: `get_available_tickets_for_event()`
  - Returns availability status
  - Handles time-based logic
  - Orders by release_order

---

## 📋 TODO: Release Feature Implementation

### Phase 1: Update Ticket Manager (Event Creation)

**File**: `app/components/events-page/ticket-manager.tsx`

**Changes Needed**:
1. Update `TicketType` interface:
   ```typescript
   export interface TicketType {
       id: string;
       ticket_name: string;
       ticket_price: string;
       tickets_available: number | null;
       // NEW:
       release_name?: string;
       release_start_time?: string; // ISO string
       release_end_time?: string;   // ISO string
       release_order?: number;
   }
   ```

2. Add release fields to UI:
   - Release name input (optional)
   - Start time picker (optional - "Available immediately" if null)
   - End time picker (optional - "Until sold out" if null)
   - Visual indicator of release order

3. Smart defaults:
   - First ticket: release_order = 1
   - New tickets: release_order = max + 1
   - Auto-suggest names: "Early Bird", "General", "Last Chance"

### Phase 2: Update APIs

**File**: `app/api/events/create/route.ts`
- Update ticket insertion to include release fields

**File**: `app/api/events/update/route.ts`
- Update ticket updates to handle release fields

**File**: `app/api/events/tickets/route.ts`
- Use `get_available_tickets_for_event()` function
- Return availability status

### Phase 3: Update Ticket Selection Modal

**File**: `app/components/events-page/ticket-selection-modal.tsx`

**Changes**:
1. Group tickets by release status:
   ```
   [Available Now]
   - Early Bird - £10 (Only 5 left!)
   - General - £15

   [Coming Soon]
   - Last Chance - £20 (Available in 2 days)

   [Sold Out]
   - Super Early - £5 (Sold Out)
   ```

2. Add status badges:
   - 🟢 Available
   - 🟡 Coming Soon (with countdown)
   - 🔴 Sold Out
   - ⏰ Ended

3. Disable selection for unavailable tickets

### Phase 4: Real-time Updates

**Optional Enhancement**:
- WebSocket/polling for live updates
- Countdown timers for upcoming releases
- Stock level updates

---

## 🎯 Example Use Cases

### Use Case 1: Early Bird Pricing
```
Event: London Tech Conference
- Early Bird: £50 (Now - Oct 1)
- Regular: £75 (Oct 1 - Oct 15)
- Last Minute: £100 (Oct 15 - Event day)
```

### Use Case 2: Luma-Style Numbered Releases
```
Event: Startup Mixer
- 1st Release: £14.99 (50 tickets, Now - 3 days)
- 2nd Release: £24.99 (100 tickets, 3-7 days)
- 3rd Release: £34.99 (150 tickets, 7 days - Event)
```

### Use Case 3: VIP + General
```
Event: Music Festival
- VIP: £200 (25 tickets, available now)
- General: £50 (500 tickets, available Oct 1)
```

---

## 📊 Migration Impact

### Intensity: **LOW to MEDIUM**

**Why Low Risk**:
- ✅ All new columns are nullable (backward compatible)
- ✅ Existing tickets work without changes
- ✅ No data migration needed
- ✅ Default values handle existing tickets

**Testing Checklist**:
1. Create event without releases (should work as before)
2. Create event with 1 release
3. Create event with multiple releases
4. Test time-based availability
5. Test sold-out handling
6. Test UI on mobile

---

## 🚀 Deployment Steps

1. **Run Migration**:
   ```bash
   psql $POSTGRES_URL -f migrations/007_add_ticket_releases.sql
   ```

2. **Test Locally**:
   - Create event with releases
   - Verify modal displays correctly
   - Test time transitions

3. **Deploy**:
   - Commit all changes
   - Push to branch
   - Deploy to Vercel
   - Monitor for errors

4. **Rollback Plan** (if needed):
   ```sql
   ALTER TABLE tickets
   DROP COLUMN IF EXISTS release_name,
   DROP COLUMN IF EXISTS release_start_time,
   DROP COLUMN IF EXISTS release_end_time,
   DROP COLUMN IF EXISTS release_order;

   DROP FUNCTION IF EXISTS get_available_tickets_for_event;
   ```

---

## 💡 Future Enhancements

1. **Release Templates**:
   - Pre-configured release structures
   - "3-Tier Pricing", "Early Bird + General", etc.

2. **Dynamic Pricing**:
   - Price increases as capacity fills
   - Demand-based pricing

3. **Waitlist**:
   - Auto-notify when new release opens
   - Automatic upgrade from waitlist

4. **Analytics**:
   - Revenue per release
   - Conversion rates
   - Optimal pricing insights

---

## 📝 Notes

- Release feature is **optional** - organizers can still create simple tickets
- Backward compatible with existing events
- Follows Luma/Eventbrite patterns (familiar to users)
- Can be extended for more complex scenarios

---

**Status**: Schema and migration complete ✅
**Next**: Update UI components for release management
