# Plan: Add Donation Functionality to Society Page

## Overview

Add standalone donation capability to the society page (`/societies/[slug]`), allowing visitors to donate directly to a society without needing to purchase an event ticket. This reuses the existing donation infrastructure while adding society-specific donation flows.

---

## Current State Analysis

### Existing Donation System (Event Ticketing)
- **Database**: `society_information.allow_donations` (boolean) - already exists
- **Database**: `event_payments.donation_amount` (integer, pence) - tracks donations attached to ticket purchases
- **API**: `/api/society/donation-settings` - GET donation settings for a society
- **API**: `/api/society/donation-settings/update` - POST toggle donation settings
- **UI**: Donation presets (£1, £3, £5) + custom input in ticket modal
- **Processing**: Stripe checkout with separate line item for donations
- **Financial**: 100% of donations go to organizer (no platform fee)

### Key Difference for Society Page
The existing system ties donations to ticket purchases. For the society page, we need **standalone donations** - a user can donate without buying anything.

---

## Implementation Plan

### Phase 1: Database Schema Update

**File**: `migrations/XXX_add_standalone_donations.sql`

Create a new table for standalone donations (separate from event payments):

```sql
CREATE TABLE IF NOT EXISTS society_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_uid UUID NOT NULL REFERENCES auth.users(id),

    -- Donor info (nullable for anonymous)
    user_id UUID REFERENCES auth.users(id),
    donor_name TEXT,
    donor_email TEXT NOT NULL,

    -- Payment details
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT,
    amount INTEGER NOT NULL, -- In pence
    currency TEXT DEFAULT 'gbp',
    payment_status TEXT DEFAULT 'pending', -- pending, succeeded, failed, cancelled

    -- Optional message from donor
    message TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Indexes
    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Enable RLS
ALTER TABLE society_donations ENABLE ROW LEVEL SECURITY;

-- Policy: Societies can view their own donations
CREATE POLICY "Societies can view own donations" ON society_donations
    FOR SELECT USING (society_uid = auth.uid());

-- Policy: Anyone can insert (for checkout flow)
CREATE POLICY "Anyone can insert donations" ON society_donations
    FOR INSERT WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX idx_society_donations_society ON society_donations(society_uid);
CREATE INDEX idx_society_donations_session ON society_donations(stripe_checkout_session_id);
```

---

### Phase 2: Type Definitions

**File**: `app/lib/types.ts`

Add new types:

```typescript
export interface SocietyDonation {
    id: string;
    society_uid: string;
    user_id?: string;
    donor_name?: string;
    donor_email: string;
    stripe_checkout_session_id?: string;
    stripe_payment_intent_id?: string;
    amount: number; // In pence
    currency: string;
    payment_status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
    message?: string;
    created_at: string;
    completed_at?: string;
}

export interface CreateSocietyDonationRequest {
    society_uid: string;
    amount: number; // In pence
    donor_name?: string;
    donor_email: string;
    message?: string;
}
```

---

### Phase 3: API Endpoints

#### 3.1 Create Donation Checkout Session

**File**: `app/api/society/donate/create-session/route.ts`

```typescript
// POST: Create Stripe checkout session for standalone donation
// Body: { society_uid, amount, donor_name?, donor_email, message? }
// Returns: { success, sessionUrl } or { error }

// Flow:
// 1. Validate society exists and has donations enabled
// 2. Validate society has Stripe Connect with charges_enabled
// 3. Validate amount (min £1 = 100 pence, max £500 = 50000 pence)
// 4. Create society_donations record with 'pending' status
// 5. Create Stripe Checkout session with:
//    - Single line item: "Donation to [Society Name]"
//    - 100% goes to connected account (no platform fee)
//    - Success URL: /societies/[slug]/donate/success?session_id={CHECKOUT_SESSION_ID}
//    - Cancel URL: /societies/[slug]
// 6. Return session URL
```

#### 3.2 Webhook Handler Update

**File**: `app/api/webhooks/stripe/route.ts`

Update existing webhook to handle society donations:

```typescript
// Add handling for checkout.session.completed:
// - Check if metadata indicates it's a society donation
// - Update society_donations record to 'succeeded'
// - Set completed_at timestamp
```

#### 3.3 Donation Success Endpoint (Optional)

**File**: `app/api/society/donate/verify/route.ts`

```typescript
// GET: Verify donation was successful
// Query: session_id
// Returns: { success, donation } or { error }
```

---

### Phase 4: UI Components

#### 4.1 Donation Modal Component

**File**: `app/components/societies/society-donation-modal.tsx`

A modal for collecting donation information:

```
┌─────────────────────────────────────────────┐
│  [X]                                        │
│                                             │
│  ❤️ Support [Society Name]                  │
│                                             │
│  Your donation goes directly to the         │
│  society to help them continue their work.  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Amount                              │    │
│  │ [£5] [£10] [£20] [£___] (custom)    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Your Name (optional)                │    │
│  │ [_______________________]           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Email Address *                     │    │
│  │ [_______________________]           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Message (optional)                  │    │
│  │ [_______________________]           │    │
│  │ [_______________________]           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [  Donate £XX.XX  ] ← Primary CTA          │
│                                             │
│  🔒 Secure payment via Stripe               │
│  100% goes directly to [Society Name]       │
│                                             │
└─────────────────────────────────────────────┘
```

**Props**:
```typescript
interface SocietyDonationModalProps {
    societyId: string;
    societyName: string;
    isOpen: boolean;
    onClose: () => void;
}
```

**Features**:
- Preset amounts: £5, £10, £20 (higher than event donations since standalone)
- Custom amount input
- Optional donor name (for recognition)
- Required email (for receipt)
- Optional message to society
- Pre-fill email if user is logged in
- Loading/processing states
- Redirect to Stripe Checkout

#### 4.2 Donation Button/Card Component

**File**: `app/components/societies/society-donate-button.tsx`

A button or card to trigger the donation modal:

```typescript
interface SocietyDonateButtonProps {
    societyId: string;
    societyName: string;
    variant?: 'button' | 'card'; // Button for nav, card for section
}
```

---

### Phase 5: Society Page Integration

**File**: `app/societies/[slug]/page.tsx`

#### 5.1 Add State & Fetch Donation Settings

```typescript
const [donationEnabled, setDonationEnabled] = useState(false);
const [showDonationModal, setShowDonationModal] = useState(false);

// Fetch donation settings when society loads
useEffect(() => {
    if (societyId) {
        fetchDonationSettings(societyId);
    }
}, [societyId]);
```

#### 5.2 Add Donation Section (new section on page)

Add a new "Support Us" section between Events and Contact:

```jsx
{/* Support Section - Only show if donations enabled */}
{donationEnabled && (
    <section id="support" className="mb-16">
        <motion.div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 ...">
            <h2>Support {name}</h2>
            <p>Your donations help us continue hosting events...</p>
            <SocietyDonateButton
                societyId={societyId}
                societyName={name}
                onClick={() => setShowDonationModal(true)}
            />
        </motion.div>
    </section>
)}
```

#### 5.3 Update Quick Navigation

Add "Support" to the quick navigation grid if donations enabled.

---

### Phase 6: Success Page

**File**: `app/societies/[slug]/donate/success/page.tsx`

A thank-you page after successful donation:

```
┌─────────────────────────────────────────────┐
│                                             │
│            ✓ Thank You!                     │
│                                             │
│  Your donation of £XX.XX to [Society Name]  │
│  has been received.                         │
│                                             │
│  A confirmation email has been sent to      │
│  [email@example.com]                        │
│                                             │
│  [  Back to Society Page  ]                 │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Phase 7: Organizer Dashboard Integration

**File**: `app/account/account-settings-section.tsx` (existing)

The donation toggle already exists. No changes needed.

**Optional Enhancement**: Add a "View Donations" section in the account dashboard to see standalone donations received.

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `migrations/XXX_add_standalone_donations.sql` | Create | New table for tracking standalone donations |
| `app/lib/types.ts` | Modify | Add SocietyDonation types |
| `app/api/society/donate/create-session/route.ts` | Create | Create Stripe checkout for donations |
| `app/api/webhooks/stripe/route.ts` | Modify | Handle donation completion |
| `app/components/societies/society-donation-modal.tsx` | Create | Modal for donation flow |
| `app/components/societies/society-donate-button.tsx` | Create | Button/card component |
| `app/societies/[slug]/page.tsx` | Modify | Add donation section & modal |
| `app/societies/[slug]/donate/success/page.tsx` | Create | Thank-you page |

---

## Technical Considerations

### Stripe Connect
- Use `transfer_data` to send 100% to connected account
- No `application_fee_amount` for donations
- Use metadata to identify as society donation vs event payment

### Amount Limits
- Minimum: £1 (100 pence) - prevents micro-transaction abuse
- Maximum: £500 (50000 pence) - reasonable upper limit
- Can be configurable per society in future

### Email Receipts
- Stripe automatically sends receipt emails
- Society name shown as seller in receipt

### Anonymous Donations
- `donor_name` is optional
- Email is required (for Stripe + receipt)
- Can show "Anonymous" in any public donor lists

### RLS Policies
- Societies can only see their own donations
- Donors cannot see other donors
- Insert allowed by anyone (checkout flow runs server-side)

---

## Implementation Order

1. **Database migration** - Create society_donations table
2. **Types** - Add TypeScript interfaces
3. **API: create-session** - Stripe checkout creation
4. **Webhook update** - Handle completion
5. **UI: Modal** - Donation form
6. **UI: Button** - Trigger component
7. **Page integration** - Add to society page
8. **Success page** - Thank-you experience
9. **Testing** - E2E flow verification

---

## Questions to Consider

1. **Should donations be visible publicly?**
   - Option A: No public donor list (simpler, more private)
   - Option B: Optional "Wall of Thanks" showing donor names

2. **Should we support recurring donations?**
   - V1: One-time only
   - V2: Could add Stripe Subscription for monthly support

3. **Should there be donation goals/progress bars?**
   - V1: Simple donations without goals
   - V2: Could add fundraising campaigns with targets

4. **Email notifications to society?**
   - When a donation is received, notify the society organizer?
