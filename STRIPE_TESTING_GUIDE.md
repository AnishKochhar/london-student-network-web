# Stripe Payment Testing Guide

## Local Development Setup

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

### 2. Configure Environment Variables

Create/update `.env.local`:

```bash
# Stripe Test Keys (from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_PLATFORM_FEE_PERCENTAGE=5

# For local testing
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development

# Database (already configured)
POSTGRES_URL=...
```

### 3. Set Up Webhook Forwarding

In a **separate terminal window**, run:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output:
```
> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
```

**Copy the `whsec_xxxxx` and add to `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

Then **restart your Next.js dev server** to pick up the new env variable.

### 4. Test Stripe Connect Onboarding

1. **Login as an organizer account** on localhost:3000
2. Go to **Account → Stripe Payments section**
3. Click **"Connect with Stripe"**
4. You'll be redirected to Stripe's test onboarding
5. Use test data:
   - **Business name:** Test Society
   - **Phone:** Any 10 digits
   - **Business address:** Use any UK address
   - **Tax ID:** `000000000` (nine zeros - valid test value)
   - **Bank account:** Use test routing/account numbers from [Stripe docs](https://stripe.com/docs/connect/testing)
     - Routing: `110000000`
     - Account: `000123456789`
6. Complete onboarding
7. You'll be redirected back to localhost:3000/account

### 5. Test Creating a Paid Event

1. **Go to /events/create** (once ticket UI is implemented)
2. Create an event with **paid tickets**
3. Add ticket types:
   - Name: "Early Bird"
   - Price: £10.00
   - Quantity: 50
4. Publish the event

### 6. Test Purchasing Tickets

1. **Login as a different user** (student account)
2. Navigate to the event
3. Click **"Register for Event"**
4. **Select ticket type and quantity**
5. You'll be redirected to **Stripe Checkout**
6. Use test card:
   - **Card number:** `4242 4242 4242 4242`
   - **Expiry:** Any future date (e.g., 12/34)
   - **CVC:** Any 3 digits (e.g., 123)
   - **ZIP:** Any 5 digits (e.g., 12345)
7. Complete payment
8. **Check your terminal** running `stripe listen` - you should see webhook events
9. You'll be redirected back with a success message
10. **Check your email** (both user and organizer should receive confirmations)

### 7. Verify Payment in Database

```sql
-- Check payment was recorded
SELECT * FROM event_payments WHERE payment_status = 'succeeded' ORDER BY created_at DESC LIMIT 5;

-- Check registration was created
SELECT * FROM event_registrations WHERE payment_status = 'paid' ORDER BY created_at DESC LIMIT 5;
```

### 8. Test Refunds

1. **Login as the event organizer**
2. Go to **event management modal** (view registrations)
3. Find a paid registration
4. Click **"Refund"** (once implemented)
5. Check webhook terminal - should see `charge.refunded` event

---

## Common Test Scenarios

### Test Cards

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 9995` | Always declines |
| `4000 0000 0000 0069` | Expires immediately (charge succeeds, then expires) |

Full list: https://stripe.com/docs/testing#cards

### Test Bank Accounts (for Connect onboarding)

| Routing Number | Account Number | Result |
|---------------|---------------|--------|
| `110000000` | `000123456789` | Successful verification |
| `110000000` | `000111111113` | Instant verification failure |

---

## Troubleshooting

### "Webhook signature verification failed"
- Make sure `STRIPE_WEBHOOK_SECRET` matches the output from `stripe listen`
- Restart your Next.js dev server after updating `.env.local`

### "Livemode requests must always be redirected via HTTPS"
- You're using **live keys** (`sk_live_...`) instead of test keys (`sk_test_...`)
- Switch to test mode in Stripe Dashboard and copy test keys

### Webhooks not triggering
- Ensure `stripe listen` is running in a separate terminal
- Check the terminal output for webhook events
- Verify the forwarding URL is `localhost:3000/api/webhooks/stripe`

### Connect onboarding link expired
- Click "Complete Setup" in the account page to get a fresh link
- Links expire after 5 minutes of inactivity

---

## Production Deployment

### 1. Configure Real Webhooks

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL:** `https://londonstudentnetwork.com/api/webhooks/stripe`
4. **Events to send:**
   - `checkout.session.completed`
   - `account.updated`
   - `charge.refunded`
5. Copy the **Signing secret** and add to production env:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

### 2. Switch to Live Mode

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Copy **live API keys**:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
3. Update production environment variables in Vercel
4. Set `NEXT_PUBLIC_BASE_URL=https://londonstudentnetwork.com`

### 3. Verify Production Setup

- Test Connect onboarding with a real organizer account
- Create a small test event (£0.50 ticket)
- Complete a purchase
- Verify webhook is received in Stripe Dashboard → Developers → Webhooks → Events
- Immediately refund the test purchase

---

## Monitoring

### View Payments in Stripe Dashboard
- **Test mode:** https://dashboard.stripe.com/test/payments
- **Live mode:** https://dashboard.stripe.com/payments

### View Connect Accounts
- **Test mode:** https://dashboard.stripe.com/test/connect/accounts
- **Live mode:** https://dashboard.stripe.com/connect/accounts

### View Webhook Logs
- **Test mode:** https://dashboard.stripe.com/test/webhooks
- **Live mode:** https://dashboard.stripe.com/webhooks
