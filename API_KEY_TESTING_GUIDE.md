# API Key Management System - Complete Testing Guide

## 📋 What We Built

A complete, production-ready API key management system that allows your team to:
1. **Create secure API keys** for integrations (n8n, Zapier, custom scripts)
2. **Manage keys** through a modern admin UI
3. **Access event data** via a public API endpoint
4. **Monitor usage** with analytics and logging
5. **Rate limit** requests to prevent abuse

---

## 🗂️ Files Created

### Database
- `migrations/010_add_api_keys.sql` - Database schema for API keys and usage logs

### Backend/API
- `app/lib/api-key-utils.ts` - Core utilities (key generation, hashing, verification, rate limiting)
- `app/lib/middleware/api-auth.ts` - Authentication middleware for API routes
- `app/api/admin/api-keys/route.ts` - List and create API keys (admin only)
- `app/api/admin/api-keys/[id]/route.ts` - View, update, and revoke specific keys (admin only)
- `app/api/events/route.ts` - Public API endpoint for fetching events (requires API key)

### Frontend/UI
- `app/admin/api-keys/page.tsx` - Main API keys management page
- `app/admin/api-keys/components/create-api-key-modal.tsx` - Modal for creating new keys

---

## 🚀 How to Test - Step by Step

### **Phase 1: Database Setup**

1. **Run the migration:**
   ```bash
   # Connect to your database
   psql $DATABASE_URL

   # Run the migration
   \i migrations/010_add_api_keys.sql

   # Verify tables were created
   \dt api_keys
   \dt api_key_usage_logs
   ```

2. **Expected output:**
   - Two new tables: `api_keys` and `api_key_usage_logs`
   - Indexes created for performance
   - No errors

---

### **Phase 2: Admin UI Testing**

#### **Test 1: Access the API Keys Page**

1. **Navigate to:** `http://localhost:3000/admin/api-keys` (or your dev URL)

2. **Expected behavior:**
   - ❌ If not logged in → Redirects to `/login?callbackUrl=/admin/api-keys`
   - ✅ After login → Returns to `/admin/api-keys`
   - ❌ If not admin → Redirects to `/`
   - ✅ If admin → Shows empty state with "Create API Key" button

3. **UI Check:**
   - Modern gradient background (slate-50 to slate-100)
   - Three stat cards at the top (Total Keys, Active Keys, Total Requests)
   - Professional table layout
   - All should show `0` initially

---

#### **Test 2: Create Your First API Key**

1. **Click "Create New Key"** button (top right or center button)

2. **Fill out the form:**
   ```
   Name: n8n Production Test
   Description: Testing API key creation for n8n automation
   Environment: Production
   Permissions: ✅ Read Events (events:read)
   Rate Limit: 1000
   Expires In: Never
   ```

3. **Click "Create API Key"**

4. **Expected result:**
   - ✅ Success toast: "API key created successfully!"
   - 🔑 Modal shows: **Full API key displayed ONCE**
   - Format: `lsn_prod_[32 random characters]`
   - Example: `lsn_prod_a3f8b2c9d1e4f5g6h7i8j9k0l1m2n3o4`

5. **IMPORTANT: Copy the key now!**
   - Click the "Copy" button
   - Save it somewhere safe (you'll need it for testing)
   - ✅ You won't see the full key again

6. **Click "Done"**

7. **Expected result:**
   - Returns to main page
   - Table now shows your new key:
     - Name: "n8n Production Test"
     - Key: `lsn_prod_a3f...` (truncated)
     - Last Used: "Never"
     - Requests (7d): 0
     - Status: 🟢 Active badge
   - Stats updated: Total Keys = 1, Active Keys = 1

---

#### **Test 3: Create Multiple Keys**

Create a few more keys with different configurations:

**Key 2:**
```
Name: Zapier Integration
Environment: Test
Permissions: events:read, registrations:read
Expires In: 90 days
```

**Key 3:**
```
Name: Analytics Dashboard
Environment: Production
Rate Limit: 5000
Expires In: Never
```

**Expected result:**
- Table shows all 3 keys
- Each with different prefixes (`lsn_prod_...` vs `lsn_test_...`)
- Stats show: Total Keys = 3, Active Keys = 3

---

#### **Test 4: Revoke a Key**

1. **Click the trash icon** next to "Zapier Integration"

2. **Confirm the dialog:** "Are you sure you want to revoke..."

3. **Expected result:**
   - ✅ Success toast: "API key revoked successfully"
   - Status badge changes to: 🔴 Revoked
   - Stats update: Active Keys = 2
   - Last Used still shows "Never"

---

### **Phase 3: Public API Testing**

Now let's test the actual API endpoint using the key you created.

#### **Test 5: Basic API Request**

**Using curl:**
```bash
curl -H "Authorization: Bearer lsn_prod_YOUR_KEY_HERE" \
  "http://localhost:3000/api/events?limit=10"
```

**Expected response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "abc123...",
      "shortId": "xY3kL9p",
      "url": "https://londonstudentnetwork.com/events/xY3kL9p",
      "title": "Karaoke Night",
      "description": "Join us for...",
      "organiser": "Imperial College Music Society",
      "startDateTime": "2025-11-22T19:00:00Z",
      "endDateTime": "2025-11-22T22:00:00Z",
      "location": {
        "building": "Student Union",
        "area": "Central London",
        "address": "..."
      },
      "imageUrl": "https://...",
      "capacity": 100,
      "visibilityLevel": "public"
    }
    // ... more events
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "meta": {
    "requestId": "...",
    "timestamp": "2025-11-22T10:00:00Z",
    "responseTime": "123ms"
  }
}
```

**Response headers should include:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 2025-11-22T11:00:00Z
```

---

#### **Test 6: Check Usage Logged**

1. **Go back to `/admin/api-keys`**

2. **Expected changes:**
   - "Last Used" now shows "a few seconds ago"
   - "Requests (7d)" shows 1
   - Total Requests stat increased by 1

---

#### **Test 7: Query Parameters**

**Filter by date range:**
```bash
curl -H "Authorization: Bearer lsn_prod_YOUR_KEY_HERE" \
  "http://localhost:3000/api/events?from=2025-11-22&to=2025-12-31&limit=50"
```

**Filter by organiser:**
```bash
curl -H "Authorization: Bearer lsn_prod_YOUR_KEY_HERE" \
  "http://localhost:3000/api/events?organiser=Imperial&limit=20"
```

**Include registration counts:**
```bash
curl -H "Authorization: Bearer lsn_prod_YOUR_KEY_HERE" \
  "http://localhost:3000/api/events?include_registrations=true&limit=10"
```

**Expected response includes:**
```json
{
  "events": [
    {
      "title": "Event Name",
      "registrationCount": 45,
      // ... other fields
    }
  ]
}
```

**Include ticket information:**
```bash
curl -H "Authorization: Bearer lsn_prod_YOUR_KEY_HERE" \
  "http://localhost:3000/api/events?include_tickets=true&limit=5"
```

**Expected response includes:**
```json
{
  "events": [
    {
      "title": "Event Name",
      "tickets": [
        {
          "id": "...",
          "name": "General Admission",
          "price": 0,
          "available": 100
        }
      ]
    }
  ]
}
```

---

#### **Test 8: Error Handling**

**Invalid API key:**
```bash
curl -H "Authorization: Bearer lsn_prod_INVALID_KEY" \
  "http://localhost:3000/api/events"
```

**Expected response (401):**
```json
{
  "success": false,
  "error": "Invalid API key",
  "message": "API key not found"
}
```

**Missing Authorization header:**
```bash
curl "http://localhost:3000/api/events"
```

**Expected response (401):**
```json
{
  "success": false,
  "error": "Missing Authorization header",
  "message": "Please provide an API key in the Authorization header as \"Bearer lsn_...\""
}
```

**Revoked key:**
```bash
# Use the key you revoked earlier
curl -H "Authorization: Bearer lsn_test_REVOKED_KEY" \
  "http://localhost:3000/api/events"
```

**Expected response (401):**
```json
{
  "success": false,
  "error": "Invalid API key",
  "message": "API key has been revoked"
}
```

---

#### **Test 9: Rate Limiting**

**Test rate limits by making 1005 requests quickly:**

```bash
# Using a loop (bash)
for i in {1..1005}; do
  curl -H "Authorization: Bearer lsn_prod_YOUR_KEY" \
    "http://localhost:3000/api/events?limit=1" \
    -w "\nRequest $i: Status %{http_code}\n"
done
```

**Expected behavior:**
- Requests 1-1000: Status 200 (success)
- Request 1001+: Status 429 (rate limit exceeded)

**Rate limit error response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "You have exceeded the rate limit of 1000 requests per hour",
  "rateLimit": {
    "limit": 1000,
    "current": 1001,
    "remaining": 0,
    "resetAt": "2025-11-22T11:00:00Z"
  }
}
```

**Response headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-11-22T11:00:00Z
Retry-After: 3600
```

---

### **Phase 4: n8n Integration Testing**

#### **Test 10: Set up n8n Workflow**

1. **Open n8n**

2. **Create new workflow**

3. **Add HTTP Request node:**
   ```
   Method: GET
   URL: https://londonstudentnetwork.com/api/events

   Authentication: Generic Credential Type
   Generic Auth Type: Header Auth

   Header Parameters:
   Name: Authorization
   Value: Bearer lsn_prod_YOUR_KEY_HERE

   Query Parameters:
   limit: 50
   include_registrations: true
   ```

4. **Execute the node**

5. **Expected result:**
   - ✅ Success
   - JSON output with events array
   - Can access event data in subsequent nodes

6. **Example workflow:**
   ```
   HTTP Request (Get Events)
   → Filter (only events with >50 registrations)
   → Notion (create database entry)
   → Slack (send notification)
   ```

---

## 🎯 All Query Parameters

### `/api/events` Endpoint

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | number | Events per page (max 100) | `?limit=50` |
| `offset` | number | Skip N events | `?offset=50` |
| `from` | ISO date | Start date filter | `?from=2025-11-22` |
| `to` | ISO date | End date filter | `?to=2025-12-31` |
| `organiser` | string | Filter by organiser (partial) | `?organiser=Imperial` |
| `visibility` | string | Filter by visibility level | `?visibility=public` |
| `include_registrations` | boolean | Include registration count | `?include_registrations=true` |
| `include_tickets` | boolean | Include ticket info | `?include_tickets=true` |
| `include_past` | boolean | Include past events | `?include_past=true` |

**Combine multiple:**
```
/api/events?from=2025-11-22&organiser=Imperial&limit=20&include_registrations=true
```

---

## 📊 Response Format

### Successful Response (200)
```json
{
  "success": true,
  "events": [...],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO-8601",
    "responseTime": "123ms"
  }
}
```

### Error Response (4xx/5xx)
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable description"
}
```

---

## 🔒 Security Features

✅ **Implemented:**
- SHA-256 hashing (keys never stored in plain text)
- Rate limiting (Redis-based, per-hour buckets)
- Scope-based permissions
- API key revocation
- Usage logging and monitoring
- Admin-only management UI

---

## 🎨 UI Features

✅ **Admin Dashboard:**
- Modern gradient design
- Real-time stats cards
- Status badges (Active/Revoked/Expired)
- Relative timestamps ("2 hours ago")
- Copy-to-clipboard for keys
- Confirmation dialogs
- Toast notifications
- Responsive layout

---

## 📈 Monitoring

**Usage logs stored in `api_key_usage_logs` table:**
- Endpoint accessed
- HTTP method & status code
- Response time
- IP address
- User agent
- Error messages
- Request parameters

**Query usage:**
```sql
-- Get usage for a specific key
SELECT * FROM api_key_usage_logs
WHERE api_key_id = 'your-key-id'
ORDER BY requested_at DESC
LIMIT 100;

-- Get error rate
SELECT
  status_code,
  COUNT(*) as count
FROM api_key_usage_logs
WHERE api_key_id = 'your-key-id'
GROUP BY status_code;
```

---

## 🐛 Troubleshooting

### "Rate limit check failed" in logs
- **Cause:** Redis connection issue
- **Impact:** Rate limiting disabled (allows all requests)
- **Fix:** Check `REDIS_URL` environment variable

### "Failed to log API key usage"
- **Cause:** Database connection issue
- **Impact:** Usage not tracked (API still works)
- **Fix:** Check database connection

### "Module not found: @/app/lib/redis"
- **Cause:** Missing Redis configuration
- **Fix:** Already fixed - uses existing `app/lib/config/private/redis.ts`

---

## ✅ Checklist

Before considering this feature complete:

- [ ] Run database migration
- [ ] Access `/admin/api-keys` as admin
- [ ] Create at least one API key
- [ ] Copy and save the key securely
- [ ] Make successful API request
- [ ] Verify usage logged in admin UI
- [ ] Test rate limiting
- [ ] Test revocation
- [ ] Set up n8n workflow (if applicable)
- [ ] Document the API key for your team

---

## 🚀 Next Steps (Optional Enhancements)

Not implemented yet, but easy to add:
1. **API key detail page** - View individual key stats, recent requests
2. **IP whitelisting** - Restrict keys to specific IPs
3. **Email notifications** - Alert when key is created/revoked/rate limited
4. **Webhook endpoints** - Real-time event notifications instead of polling
5. **More scopes** - `events:write`, `registrations:write`, etc.
6. **Key rotation** - Generate new key while keeping old one active temporarily

---

**Questions or issues?** Check the implementation files or test following this guide!
