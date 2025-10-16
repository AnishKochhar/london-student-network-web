# Cron Email System - Testing Guide

## 🎯 What Can Be Tested Locally vs Production

| Component | Local Testing | Production Only |
|-----------|--------------|-----------------|
| Redis Connection | ✅ Yes | ✅ Yes |
| BullMQ Queue Operations | ✅ Yes | ✅ Yes |
| Email Sending (SendGrid) | ✅ Yes | ✅ Yes |
| Cron Job Logic | ✅ Yes (manual trigger) | ✅ Yes |
| Worker Processing | ✅ Yes (manual trigger) | ✅ Yes |
| Automated Scheduling | ❌ No | ✅ Yes (Vercel handles) |

**Bottom line:** Everything except Vercel's automatic scheduling can be tested locally!

---

## 📋 Testing Checklist (Run in Order)

### Step 1: Test Redis Connection
```bash
npx tsx scripts/test-redis-connection.ts
```
**What it tests:**
- Can connect to Redis Cloud
- Can read/write data
- Redis is responding correctly

**Expected output:**
```
✅ PING response: PONG
✅ Set test key with 60s expiry
✅ Retrieved value: Hello from LSN!
✅ Redis version: 7.x.x
🎉 All Redis tests passed!
```

---

### Step 2: Test BullMQ Queue
```bash
npx tsx scripts/test-bullmq-queue.ts
```
**What it tests:**
- Can create jobs in queue
- Can add delayed jobs
- Worker can process jobs
- Queue state management

**Expected output:**
```
✅ Job added with ID: 1
✅ Delayed job added with ID: 2
✅ Immediate job state: wait
✅ Delayed job state: delayed
✅ Queue counts: { wait: 1, delayed: 1, ... }
📨 Processing job 1: This should process immediately
🎉 All BullMQ tests passed!
```

---

### Step 3: Start Dev Server
```bash
pnpm dev
```
Keep this running in a separate terminal.

---

### Step 4: Test Cron Job Endpoint
**In a new terminal:**
```bash
npx tsx scripts/test-cron-locally.ts
```
**What it tests:**
- Cron endpoint is accessible
- Authorization works (CRON_SECRET)
- Can scan for events
- Can create jobs for users
- Can send external forwarding emails

**Expected output:**
```
✅ Cron job executed successfully!
📊 Summary:
   - Events processed: 0 (or more if you have events)
   - Reminders scheduled: 0 (or more)
   - External emails sent: 0 (or more)
✅ Authorization properly blocked unauthorized access
```

---

### Step 5: Test Worker Endpoint
```bash
npx tsx scripts/test-worker-locally.ts
```
**What it tests:**
- Worker can start and connect to queue
- Worker processes jobs from Redis
- Email sending works

**Expected output:**
```
✅ Worker executed successfully!
💡 Note: Worker ran for ~50 seconds and processed jobs from queue
```

**⚠️ Warning:** This runs for 50 seconds! Don't interrupt it.

---

### Step 6: Inspect Queue Contents
```bash
npx tsx scripts/inspect-redis-queue.ts
```
**What it shows:**
- Current jobs in queue
- Delayed jobs and when they'll run
- Failed jobs (if any)
- Queue statistics

**Example output:**
```
📊 Queue Statistics:
   Waiting: 0
   Delayed: 5
   Active: 0
   Completed: 2
   Failed: 0

⏰ Delayed Jobs:
   Job 123: user-abc for event party-xyz
      Sends in: 23.5 hours
```

---

## 🧪 Full Integration Test (Realistic Scenario)

This tests the complete flow:

1. **Create a test event** in your database that starts in 24 hours:
```sql
-- Run in your PostgreSQL client
INSERT INTO events (
    id, title, start_datetime, end_datetime,
    is_deleted, is_hidden, external_forward_email
) VALUES (
    gen_random_uuid(),
    'Test Event',
    NOW() + INTERVAL '24 hours',
    NOW() + INTERVAL '25 hours',
    false,
    false,
    'test@example.com'  -- Your test email
);
```

2. **Add a test registration:**
```sql
INSERT INTO event_registrations (
    event_id, user_id, name, email, external
) VALUES (
    '<event-id-from-above>',
    '<your-user-id>',
    'Test User',
    'your-email@example.com',
    false
);
```

3. **Run the cron job:**
```bash
npx tsx scripts/test-cron-locally.ts
```
Expected:
- ✅ 1 event processed
- ✅ 1 reminder scheduled
- ✅ 1 external email sent to test@example.com

4. **Check the queue:**
```bash
npx tsx scripts/inspect-redis-queue.ts
```
Expected:
- Should show 1 delayed job for ~23 hours

5. **Manually trigger the worker** (to test email sending):
```bash
npx tsx scripts/test-worker-locally.ts
```
Expected:
- Worker runs but job isn't ready yet (delay not elapsed)

6. **Test immediate sending** (bypass delay):
   - Edit the job in Redis to remove delay
   - Or update the job's timestamp to be in the past
   - Run worker again

---

## 🔧 Troubleshooting

### Issue: "REDIS_URL not found"
**Fix:**
```bash
# Make sure .env file exists and contains:
REDIS_URL="redis://default:WWQblIMpHttK9f3NAv6fIB86Sp3CICrq@redis-19982.c3.eu-west-1-2.ec2.redns.redis-cloud.com:19982"
```

### Issue: "ECONNREFUSED" when connecting to Redis
**Fix:**
1. Check Redis Cloud dashboard - is instance running?
2. Check IP allowlist in Redis Cloud (should allow all IPs)
3. Test connection manually:
```bash
redis-cli -u "redis://default:WWQblIMpHttK9f3NAv6fIB86Sp3CICrq@redis-19982.c3.eu-west-1-2.ec2.redns.redis-cloud.com:19982" ping
```

### Issue: "Failed to call cron endpoint"
**Fix:**
Make sure dev server is running: `pnpm dev`

### Issue: Cron returns 401 Unauthorized
**Fix:**
Check `.env` has correct `CRON_SECRET`:
```bash
CRON_SECRET="ItoP5RhLx1GtSsqFVd6ujNjqwiH0bSWLrcBO4Gdnn5o="
```

### Issue: No events found when testing
**Normal!** This means you don't have events starting in 24 hours. Create a test event (see Full Integration Test above).

### Issue: SendGrid emails not sending
**Check:**
1. `SENDGRID_API_KEY` is valid
2. SendGrid account is active
3. Check SendGrid dashboard for errors
4. Verify sender email is verified in SendGrid

---

## 📊 Monitoring in Production

Once deployed to Vercel:

### View Cron Logs
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Logs" tab
4. Filter by `/api/cron/` or `/api/workers/`

### View Redis Contents
```bash
npx tsx scripts/inspect-redis-queue.ts
```
Works in production too! Just make sure your `.env` matches production Redis.

### Manual Trigger in Production
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/scan-event-reminders
```

---

## 🎓 Understanding the Output

### Cron Job Output
```json
{
  "success": true,
  "timestamp": "2024-10-12T18:00:00Z",
  "eventsProcessed": 3,        // Events starting in 24 hours
  "remindersScheduled": 45,    // Total reminder emails queued
  "externalEmailsSent": 2,     // External forwarding emails sent now
  "errors": []                 // Any failures
}
```

### Worker Output
```json
{
  "success": true,
  "message": "Worker processed jobs for 50 seconds",
  "timestamp": "2024-10-12T18:15:00Z"
}
```
(Worker doesn't return job count - it just processes whatever is ready)

### Queue Inspection
- **Waiting**: Jobs ready to process now
- **Delayed**: Jobs scheduled for future (e.g., 23 hours)
- **Active**: Currently being processed
- **Completed**: Successfully sent
- **Failed**: Failed after all retries

---

## ✅ Production Deployment

After local testing passes:

1. **Set environment variables in Vercel:**
```bash
vercel env add REDIS_URL production
# Paste: redis://default:WWQblIMpHttK9f3NAv6fIB86Sp3CICrq@redis-19982.c3.eu-west-1-2.ec2.redns.redis-cloud.com:19982

vercel env add CRON_SECRET production
# Paste: ItoP5RhLx1GtSsqFVd6ujNjqwiH0bSWLrcBO4Gdnn5o=
```

2. **Deploy:**
```bash
git push
```

3. **Verify cron jobs are scheduled:**
   - Vercel Dashboard → Project → Settings → Cron Jobs
   - Should show:
     - `/api/cron/scan-event-reminders` - Every 6 hours
     - `/api/workers/process-email-reminders` - Every 15 minutes

4. **Monitor first run:**
   - Wait for next scheduled time (or trigger manually)
   - Check logs in Vercel Dashboard
   - Inspect queue: `npx tsx scripts/inspect-redis-queue.ts`

---

## 🚨 Important Notes

1. **Worker runs for 50 seconds** - This is intentional to stay under Vercel's 60s limit
2. **Delayed jobs won't process immediately** - By design! They wait for the scheduled time
3. **Test emails might go to spam** - Check spam folder during testing
4. **Redis persists between tests** - Use `inspect-redis-queue.ts` to see what's queued
5. **Vercel cron only works in production** - Local testing requires manual triggering

---

## 📚 Quick Reference

```bash
# Test infrastructure
npx tsx scripts/test-redis-connection.ts
npx tsx scripts/test-bullmq-queue.ts

# Test endpoints (needs pnpm dev running)
npx tsx scripts/test-cron-locally.ts
npx tsx scripts/test-worker-locally.ts

# Inspect queue contents
npx tsx scripts/inspect-redis-queue.ts

# Run dev server
pnpm dev

# Build for production
pnpm build
```
