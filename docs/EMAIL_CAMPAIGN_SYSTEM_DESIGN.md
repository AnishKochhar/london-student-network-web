# Email Campaign System - Full Design Specification

## Executive Summary

A comprehensive email campaign management system for the LSN admin dashboard, enabling mass email campaigns with list management, template creation, real-time analytics, and detailed history tracking.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [UI/UX Design](#3-uiux-design)
4. [Feature Specifications](#4-feature-specifications)
5. [API Routes](#5-api-routes)
6. [SendGrid Integration](#6-sendgrid-integration)
7. [Component Architecture](#7-component-architecture)
8. [Implementation Phases](#8-implementation-phases)
9. [Performance Considerations](#9-performance-considerations)

---

## 1. System Architecture

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                              │
│  /admin/campaigns                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   CONTACTS   │  │  TEMPLATES   │  │  CAMPAIGNS   │           │
│  │              │  │              │  │              │           │
│  │ - Import     │  │ - Create     │  │ - Draft      │           │
│  │ - Categories │  │ - Preview    │  │ - Schedule   │           │
│  │ - Edit       │  │ - Variables  │  │ - Send       │           │
│  │ - Export     │  │ - Signature  │  │ - Track      │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │  ANALYTICS   │  │   HISTORY    │                             │
│  │              │  │              │                             │
│  │ - Opens      │  │ - Past Sent  │                             │
│  │ - Clicks     │  │ - Recipients │                             │
│  │ - Bounces    │  │ - Timeline   │                             │
│  │ - Trends     │  │ - Export     │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │
│  │  API Routes    │  │  SendGrid API  │  │  Webhooks      │     │
│  │  /api/admin/   │  │                │  │  /api/webhooks/│     │
│  │  campaigns/*   │  │  - Send        │  │  sendgrid      │     │
│  │                │  │  - Track       │  │                │     │
│  └────────────────┘  └────────────────┘  └────────────────┘     │
│                              │                    │              │
│                              ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    VERCEL POSTGRES                       │    │
│  │  - email_contacts    - email_templates                   │    │
│  │  - email_categories  - email_campaigns                   │    │
│  │  - email_sends       - email_events (webhooks)           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack (Existing LSN Stack)

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion
- **UI Components**: Radix UI, TanStack Table, React Hook Form
- **Database**: Vercel Postgres
- **Email**: SendGrid API
- **Auth**: NextAuth (admin role required)
- **State**: React Query for server state

---

## 2. Database Schema

### New Tables

```sql
-- ============================================
-- EMAIL CATEGORIES (Hierarchical)
-- ============================================
CREATE TABLE email_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES email_categories(id) ON DELETE SET NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1', -- Hex color for UI
  icon VARCHAR(50) DEFAULT 'folder', -- Lucide icon name
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example hierarchy:
-- Imperial College (parent_id: null)
--   └── Tech & Innovation (parent_id: imperial-id)
--   └── Arts & Culture (parent_id: imperial-id)
--   └── Sports (parent_id: imperial-id)
-- King's College (parent_id: null)
--   └── Academic (parent_id: kings-id)

-- ============================================
-- EMAIL CONTACTS
-- ============================================
CREATE TABLE email_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  organization VARCHAR(255), -- e.g., "Neurotechnology Society"
  category_id UUID REFERENCES email_categories(id) ON DELETE SET NULL,

  -- Additional metadata
  metadata JSONB DEFAULT '{}', -- Flexible: { memberCount, website, instagram, etc. }
  tags TEXT[] DEFAULT '{}', -- Array of tags for filtering
  notes TEXT,

  -- Status tracking
  status VARCHAR(20) DEFAULT 'active', -- active, unsubscribed, bounced, complained
  unsubscribed_at TIMESTAMP,
  bounce_count INT DEFAULT 0,
  last_emailed_at TIMESTAMP,

  -- Import tracking
  source VARCHAR(100), -- 'manual', 'csv_import', 'scraper'
  imported_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(email) -- Prevent duplicates
);

CREATE INDEX idx_contacts_category ON email_contacts(category_id);
CREATE INDEX idx_contacts_status ON email_contacts(status);
CREATE INDEX idx_contacts_email ON email_contacts(email);

-- ============================================
-- EMAIL TEMPLATES
-- ============================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,

  -- Content
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT, -- Plain text fallback

  -- Template variables (for preview)
  -- e.g., ["{{name}}", "{{organization}}", "{{custom_greeting}}"]
  variables TEXT[] DEFAULT '{}',

  -- Signature selection
  signature_id UUID REFERENCES email_signatures(id),

  -- Categorization
  category VARCHAR(100), -- 'outreach', 'followup', 'partnership', 'announcement'

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,

  -- Metadata
  preview_text VARCHAR(200), -- Email preview text
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- EMAIL SIGNATURES
-- ============================================
CREATE TABLE email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  html TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- EMAIL CAMPAIGNS
-- ============================================
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Template reference
  template_id UUID REFERENCES email_templates(id),

  -- Override template subject/body if needed
  subject_override VARCHAR(500),
  body_override TEXT,

  -- Sender config
  from_email VARCHAR(255) DEFAULT 'hello@londonstudentnetwork.com',
  from_name VARCHAR(255) DEFAULT 'London Student Network',
  reply_to VARCHAR(255) DEFAULT 'hello@londonstudentnetwork.com',

  -- Recipients (category-based or custom list)
  recipient_type VARCHAR(20) DEFAULT 'category', -- 'category', 'custom', 'all'
  recipient_category_ids UUID[] DEFAULT '{}', -- If category-based
  recipient_filter JSONB DEFAULT '{}', -- Custom filters: { tags: [], status: 'active' }

  -- Scheduling
  status VARCHAR(20) DEFAULT 'draft', -- draft, scheduled, sending, sent, paused, cancelled
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Stats (denormalized for quick access)
  total_recipients INT DEFAULT 0,
  sent_count INT DEFAULT 0,
  delivered_count INT DEFAULT 0,
  opened_count INT DEFAULT 0,
  clicked_count INT DEFAULT 0,
  bounced_count INT DEFAULT 0,
  complained_count INT DEFAULT 0,
  unsubscribed_count INT DEFAULT 0,

  -- Settings
  track_opens BOOLEAN DEFAULT true,
  track_clicks BOOLEAN DEFAULT true,
  batch_size INT DEFAULT 20,
  delay_between_ms INT DEFAULT 1000,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_campaigns_created ON email_campaigns(created_at DESC);

-- ============================================
-- EMAIL SENDS (Individual email records)
-- ============================================
CREATE TABLE email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES email_contacts(id) ON DELETE SET NULL,

  -- Recipient info (denormalized for history)
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  to_organization VARCHAR(255),

  -- Email content (snapshot at send time)
  subject VARCHAR(500) NOT NULL,

  -- SendGrid tracking
  sendgrid_message_id VARCHAR(255),

  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending',
  -- pending, queued, sent, delivered, opened, clicked, bounced, dropped, spam, unsubscribed

  -- Timestamps from SendGrid events
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  first_opened_at TIMESTAMP,
  last_opened_at TIMESTAMP,
  first_clicked_at TIMESTAMP,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  bounce_type VARCHAR(50), -- hard, soft, blocked

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sends_campaign ON email_sends(campaign_id);
CREATE INDEX idx_sends_contact ON email_sends(contact_id);
CREATE INDEX idx_sends_status ON email_sends(status);
CREATE INDEX idx_sends_sendgrid_id ON email_sends(sendgrid_message_id);

-- ============================================
-- EMAIL EVENTS (SendGrid Webhook Events)
-- ============================================
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,

  -- Event info
  event_type VARCHAR(50) NOT NULL,
  -- processed, dropped, delivered, deferred, bounce, open, click, spam_report, unsubscribe

  -- Event metadata
  timestamp TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  url TEXT, -- For click events
  reason TEXT, -- For bounce/drop events

  -- Raw SendGrid payload
  raw_payload JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_send ON email_events(send_id);
CREATE INDEX idx_events_type ON email_events(event_type);
CREATE INDEX idx_events_timestamp ON email_events(timestamp DESC);
```

### Migration File

Save as: `migrations/011_email_campaigns.sql`

---

## 3. UI/UX Design

### Navigation Structure (Notion-style Breadcrumbs)

```
Admin > Campaigns > [Section]
        │
        ├── Contacts
        │   ├── All Contacts
        │   ├── By Category (collapsible tree)
        │   │   ├── Imperial College
        │   │   │   ├── Tech & Innovation
        │   │   │   ├── Arts & Culture
        │   │   │   └── Sports
        │   │   ├── King's College
        │   │   └── + Add Category
        │   ├── Import
        │   └── Export
        │
        ├── Templates
        │   ├── All Templates
        │   ├── Create New
        │   └── Signatures
        │
        ├── Campaigns
        │   ├── Active
        │   ├── Drafts
        │   ├── Scheduled
        │   └── Create New
        │
        ├── Analytics
        │   ├── Overview
        │   ├── By Campaign
        │   └── Trends
        │
        └── History
            ├── Recent Sends
            └── By Recipient
```

### Layout Design

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Admin / Campaigns / Contacts / Imperial College                   │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ ┌────────────────────┐ ┌───────────────────────────────────────────┐│
│ │                    │ │                                           ││
│ │  SIDEBAR           │ │  MAIN CONTENT                             ││
│ │  (Category Tree)   │ │                                           ││
│ │                    │ │  ┌─────────────────────────────────────┐  ││
│ │  📁 All Contacts   │ │  │ Imperial College                    │  ││
│ │                    │ │  │ 156 contacts • 3 subcategories      │  ││
│ │  📂 Imperial ▼     │ │  └─────────────────────────────────────┘  ││
│ │    ├─ Tech (42)    │ │                                           ││
│ │    ├─ Arts (38)    │ │  ┌────────────────────────────────────┐   ││
│ │    └─ Sports (76)  │ │  │ Search...          [+ Add] [Import]│   ││
│ │                    │ │  └────────────────────────────────────┘   ││
│ │  📂 King's ▶       │ │                                           ││
│ │  📂 UCL ▶          │ │  ┌────────────────────────────────────┐   ││
│ │                    │ │  │ ☐ │ Name           │ Email    │ ... │   ││
│ │  ───────────────── │ │  │ ☐ │ Neurotech Soc  │ neuro@.. │     │   ││
│ │  + Add Category    │ │  │ ☐ │ AI Society     │ ai@...   │     │   ││
│ │                    │ │  └────────────────────────────────────┘   ││
│ │                    │ │                                           ││
│ └────────────────────┘ └───────────────────────────────────────────┘│
│                                                                      │
│                        ┌───────────────────────────────────────────┐│
│                        │ SLIDE-IN PANEL (Contact Details)          ││
│                        │ ─────────────────────────────────────     ││
│                        │ Neurotechnology Society                   ││
│                        │ neurotech@imperial.ac.uk                  ││
│                        │                                           ││
│                        │ Category: Imperial > Tech                 ││
│                        │ Status: Active ●                          ││
│                        │ Last Emailed: 2 days ago                  ││
│                        │                                           ││
│                        │ ──── Email History ────                   ││
│                        │ • "Quick question..." - Opened ✓          ││
│                        │ • "Follow up" - Delivered                 ││
│                        │                                           ││
│                        │ [Edit] [Send Email] [Remove]              ││
│                        └───────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Slide-In Panel Behavior

1. **Click on row** → Panel slides in from right (400px width)
2. **Content shifts left** → Main content compresses smoothly
3. **Close button (×)** → Panel slides out, content expands back
4. **Escape key** → Also closes panel
5. **Click outside** → Optional close behavior

### Color Scheme (Matching LSN Dark Theme)

```css
/* Primary Colors */
--bg-primary: #0a0a0f;      /* Deep dark */
--bg-secondary: #111118;    /* Card background */
--bg-hover: #1a1a24;        /* Hover states */
--border: #2a2a3a;          /* Subtle borders */

/* Accent Colors */
--accent-primary: #6366f1;  /* Indigo - Primary actions */
--accent-success: #22c55e;  /* Green - Success states */
--accent-warning: #f59e0b;  /* Amber - Warnings */
--accent-danger: #ef4444;   /* Red - Errors/Delete */

/* Status Colors */
--status-active: #22c55e;
--status-pending: #f59e0b;
--status-sent: #3b82f6;
--status-opened: #8b5cf6;
--status-bounced: #ef4444;
```

### Key UI Components

#### 1. Breadcrumb Navigation

```tsx
// Notion-style with clickable segments
<Breadcrumb>
  <BreadcrumbItem href="/admin">Admin</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem href="/admin/campaigns">Campaigns</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem href="/admin/campaigns/contacts">Contacts</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbCurrent>Imperial College</BreadcrumbCurrent>
</Breadcrumb>
```

#### 2. Category Tree (Collapsible)

```tsx
// File-explorer style with drag-drop reordering
<CategoryTree>
  <CategoryItem
    icon="folder"
    label="Imperial College"
    count={156}
    expanded
  >
    <CategoryItem icon="tag" label="Tech & Innovation" count={42} />
    <CategoryItem icon="tag" label="Arts & Culture" count={38} />
    <CategoryItem icon="tag" label="Sports" count={76} />
  </CategoryItem>
  <CategoryItem icon="folder" label="King's College" count={89} />
</CategoryTree>
```

#### 3. Data Table with Actions

```tsx
// TanStack Table with row selection, sorting, filtering
<DataTable
  columns={contactColumns}
  data={contacts}
  searchPlaceholder="Search contacts..."
  filterOptions={[
    { key: 'status', label: 'Status', options: ['active', 'bounced'] },
    { key: 'lastEmailed', label: 'Last Emailed', type: 'date-range' }
  ]}
  bulkActions={[
    { label: 'Send Campaign', icon: 'mail', onClick: handleBulkSend },
    { label: 'Move to Category', icon: 'folder', onClick: handleMove },
    { label: 'Export', icon: 'download', onClick: handleExport },
    { label: 'Delete', icon: 'trash', variant: 'danger', onClick: handleDelete }
  ]}
  onRowClick={handleRowClick} // Opens slide-in panel
/>
```

#### 4. Import Modal

```tsx
// Step-by-step import wizard
<ImportWizard>
  <Step title="Upload File">
    <FileDropzone accept=".csv,.json" />
    <p>Or paste emails directly:</p>
    <Textarea placeholder="email@example.com&#10;another@example.com" />
  </Step>

  <Step title="Map Columns">
    <ColumnMapper
      detectedColumns={['Email', 'Name', 'Society']}
      targetFields={['email', 'name', 'organization']}
    />
  </Step>

  <Step title="Select Category">
    <CategorySelect allowCreate />
  </Step>

  <Step title="Review & Import">
    <ImportPreview count={156} duplicates={3} />
    <Button>Import {153} Contacts</Button>
  </Step>
</ImportWizard>
```

#### 5. Template Editor

```tsx
// Rich template editor with live preview
<TemplateEditor>
  <TemplateForm>
    <Input label="Template Name" />
    <Input label="Subject Line" />
    <Textarea
      label="Email Body"
      placeholder="Use {{name}} for personalization..."
      rows={12}
    />
    <SignatureSelect />
    <VariableHelper variables={['{{name}}', '{{organization}}', '{{category}}']} />
  </TemplateForm>

  <TemplatePreview>
    <EmailPreview
      subject={subject}
      body={body}
      signature={selectedSignature}
      sampleData={{ name: 'John', organization: 'Tech Society' }}
    />
  </TemplatePreview>
</TemplateEditor>
```

#### 6. Campaign Builder

```tsx
// Multi-step campaign creation
<CampaignBuilder>
  <Step title="Recipients">
    <RecipientSelector>
      <Option value="category">Select by Category</Option>
      <Option value="custom">Custom List</Option>
      <Option value="all">All Contacts</Option>
    </RecipientSelector>

    {recipientType === 'category' && (
      <CategoryMultiSelect selected={selectedCategories} />
    )}

    <RecipientPreview count={selectedCount} />
  </Step>

  <Step title="Content">
    <TemplateSelect templates={templates} />
    <TemplatePreview template={selectedTemplate} />
    <Checkbox label="Customize for this campaign" />
  </Step>

  <Step title="Settings">
    <Input label="Campaign Name" />
    <Select label="Send From" options={senderOptions} />
    <Toggle label="Track Opens" />
    <Toggle label="Track Clicks" />
  </Step>

  <Step title="Review & Send">
    <CampaignSummary />
    <ButtonGroup>
      <Button variant="secondary">Save as Draft</Button>
      <Button variant="secondary">Schedule</Button>
      <Button variant="primary">Send Now</Button>
    </ButtonGroup>
  </Step>
</CampaignBuilder>
```

#### 7. Analytics Dashboard

```tsx
// Real-time campaign analytics
<AnalyticsDashboard>
  <StatsRow>
    <StatCard label="Sent" value={1250} icon="send" />
    <StatCard label="Delivered" value={1230} icon="check" rate="98.4%" />
    <StatCard label="Opened" value={615} icon="eye" rate="50%" />
    <StatCard label="Clicked" value={123} icon="mouse-pointer" rate="10%" />
  </StatsRow>

  <ChartsRow>
    <OpenRateChart data={openTrend} />
    <ClickHeatmap data={clickData} />
  </ChartsRow>

  <TopPerformers>
    <Table
      title="Best Performing Subjects"
      data={topSubjects}
      columns={['subject', 'openRate', 'clickRate']}
    />
  </TopPerformers>
</AnalyticsDashboard>
```

#### 8. History Timeline

```tsx
// Beautiful timeline of sent emails
<HistoryTimeline>
  <TimelineGroup date="Today">
    <TimelineItem
      time="2:34 PM"
      campaign="Imperial Outreach"
      recipient="Neurotechnology Society"
      email="neurotech@imperial.ac.uk"
      status="opened"
      opens={3}
    />
    <TimelineItem
      time="2:34 PM"
      campaign="Imperial Outreach"
      recipient="AI Society"
      email="ai@imperial.ac.uk"
      status="delivered"
    />
  </TimelineGroup>

  <TimelineGroup date="Yesterday">
    {/* More items */}
  </TimelineGroup>
</HistoryTimeline>
```

---

## 4. Feature Specifications

### 4.1 Contact Management

#### Import Methods

1. **CSV Upload**
   - Drag-drop file upload
   - Auto-detect columns (email, name, organization)
   - Column mapping interface
   - Duplicate detection (skip, update, or create new)
   - Batch size: up to 10,000 contacts

2. **Manual Entry**
   - Single contact form
   - Quick-add mode (email only)
   - Paste multiple emails (one per line)

3. **JSON Import**
   - Support existing `=6` format
   - Map `categorizedSocieties` structure

#### Contact Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email address |
| name | string | No | Contact name |
| organization | string | No | Society/org name |
| category_id | uuid | No | Primary category |
| tags | string[] | No | Custom tags |
| metadata | json | No | Flexible extra data |
| status | enum | Auto | active/unsubscribed/bounced |

#### Contact Actions

- Edit individual contact
- Bulk move to category
- Bulk add tags
- Bulk delete
- Export selected (CSV/JSON)
- View email history
- Send individual email

### 4.2 Category System

#### Hierarchy

- **Unlimited depth** (recommended max: 3 levels)
- **Root categories**: Universities (Imperial, King's, UCL, etc.)
- **Sub-categories**: Types (Tech, Arts, Sports, Academic, etc.)
- **Sub-sub-categories**: Specific groups (optional)

#### Category Features

- Drag-drop reordering
- Color coding
- Icon selection (Lucide icons)
- Contact count badges
- Bulk operations on category
- Merge categories
- Delete with contact reassignment

### 4.3 Template System

#### Template Components

1. **Subject Line**
   - Variable support: `{{name}}`, `{{organization}}`
   - Character count (< 50 recommended)
   - Preview text (optional)

2. **Body Content**
   - Rich HTML editor
   - Variable insertion toolbar
   - Plain text auto-generation

3. **Signatures**
   - Multiple signature designs (from `=6` templates)
   - Select per template or override per campaign

#### Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{name}}` | Contact name | "John" |
| `{{organization}}` | Organization | "Tech Society" |
| `{{email}}` | Email address | "john@..." |
| `{{category}}` | Category name | "Imperial > Tech" |
| `{{unsubscribe_link}}` | Unsubscribe URL | Auto-generated |

### 4.4 Campaign Workflow

#### Campaign States

```
DRAFT → SCHEDULED → SENDING → SENT
          ↓            ↓
        CANCELLED    PAUSED → RESUMED → SENT
```

#### Sending Process

1. **Queue Creation**
   - Generate recipient list from filters
   - Create `email_sends` records
   - Status: `pending`

2. **Batch Processing**
   - Process in batches (configurable, default: 20)
   - Delay between emails (configurable, default: 1s)
   - Update status: `sent`

3. **Error Handling**
   - Retry on temporary failures (3x)
   - Mark as `failed` on permanent errors
   - Continue with remaining recipients

4. **Completion**
   - Update campaign status: `sent`
   - Record `completed_at` timestamp
   - Calculate final stats

### 4.5 Analytics & Tracking

#### SendGrid Webhook Events

| Event | Description | Updates |
|-------|-------------|---------|
| `processed` | Email accepted by SendGrid | send.status → 'queued' |
| `delivered` | Email delivered to recipient | send.status → 'delivered', delivered_at |
| `open` | Email opened | send.status → 'opened', open_count++, first/last_opened_at |
| `click` | Link clicked | send.click_count++, first_clicked_at |
| `bounce` | Email bounced | send.status → 'bounced', contact.bounce_count++, contact.status |
| `spam_report` | Marked as spam | send.status → 'spam', contact.status → 'complained' |
| `unsubscribe` | Clicked unsubscribe | send.status → 'unsubscribed', contact.status → 'unsubscribed' |

#### Analytics Metrics

1. **Delivery Metrics**
   - Sent count
   - Delivered count & rate
   - Bounce count & rate (hard vs soft)
   - Drop count (invalid addresses)

2. **Engagement Metrics**
   - Open count & rate
   - Unique opens vs total opens
   - Click count & rate
   - Click-to-open rate (CTOR)

3. **Health Metrics**
   - Spam complaint rate
   - Unsubscribe rate
   - List growth/decline

4. **Trend Analysis**
   - Opens over time (hourly/daily)
   - Best send times
   - Subject line performance

### 4.6 History View

#### Timeline Features

- **Grouping**: By date (Today, Yesterday, This Week, etc.)
- **Filtering**: By campaign, status, recipient
- **Search**: By recipient name/email
- **Details**: Click to expand full email content
- **Quick Actions**: Resend, view in campaign

#### Export Options

- CSV export with all fields
- Date range selection
- Status filtering
- Campaign filtering

---

## 5. API Routes

### Route Structure

```
/api/admin/campaigns/
├── contacts/
│   ├── GET    - List contacts (with pagination, filters)
│   ├── POST   - Create contact(s)
│   ├── PUT    - Update contact
│   ├── DELETE - Delete contact(s)
│   └── import/
│       └── POST - Import from CSV/JSON
│
├── categories/
│   ├── GET    - List categories (tree structure)
│   ├── POST   - Create category
│   ├── PUT    - Update category
│   ├── DELETE - Delete category
│   └── reorder/
│       └── POST - Reorder categories
│
├── templates/
│   ├── GET    - List templates
│   ├── POST   - Create template
│   ├── PUT    - Update template
│   ├── DELETE - Delete template
│   └── signatures/
│       ├── GET  - List signatures
│       └── POST - Create signature
│
├── campaigns/
│   ├── GET    - List campaigns
│   ├── POST   - Create campaign
│   ├── PUT    - Update campaign
│   ├── DELETE - Delete campaign
│   ├── [id]/
│   │   ├── GET     - Get campaign details
│   │   ├── send/   - POST - Start sending
│   │   ├── pause/  - POST - Pause sending
│   │   ├── resume/ - POST - Resume sending
│   │   └── stats/  - GET - Get campaign stats
│   └── preview/
│       └── POST - Generate email preview
│
├── analytics/
│   ├── GET    - Overall analytics
│   ├── campaigns/[id]/ - Campaign-specific
│   └── trends/ - Historical trends
│
├── history/
│   ├── GET    - List sent emails (paginated)
│   └── export/ - POST - Export history
│
└── /api/webhooks/
    └── sendgrid/
        └── POST - Handle SendGrid events
```

### Example API Implementations

```typescript
// GET /api/admin/campaigns/contacts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const categoryId = searchParams.get('category');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const offset = (page - 1) * limit;

  let query = `
    SELECT c.*, cat.name as category_name
    FROM email_contacts c
    LEFT JOIN email_categories cat ON c.category_id = cat.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (categoryId) {
    params.push(categoryId);
    query += ` AND c.category_id = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND c.status = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (c.email ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.organization ILIKE $${params.length})`;
  }

  query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows: contacts } = await sql.query(query, params);
  const { rows: [{ count }] } = await sql.query(`SELECT COUNT(*) FROM email_contacts`);

  return NextResponse.json({
    contacts,
    pagination: {
      page,
      limit,
      total: parseInt(count),
      totalPages: Math.ceil(parseInt(count) / limit)
    }
  });
}
```

---

## 6. SendGrid Integration

### Webhook Setup

1. **Create webhook endpoint**: `/api/webhooks/sendgrid`
2. **Configure in SendGrid Dashboard**:
   - Settings → Mail Settings → Event Webhooks
   - URL: `https://londonstudentnetwork.com/api/webhooks/sendgrid`
   - Select events: all
   - Enable HTTP POST

### Webhook Handler

```typescript
// /api/webhooks/sendgrid/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: string;
  sg_message_id: string;
  ip?: string;
  useragent?: string;
  url?: string;
  reason?: string;
  bounce_classification?: string;
}

// Verify SendGrid signature
function verifySignature(
  publicKey: string,
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const timestampPayload = timestamp + payload;
  const decodedSignature = Buffer.from(signature, 'base64');

  const verifier = crypto.createVerify('sha256');
  verifier.update(timestampPayload);

  return verifier.verify(publicKey, decodedSignature);
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('X-Twilio-Email-Event-Webhook-Signature');
  const timestamp = request.headers.get('X-Twilio-Email-Event-Webhook-Timestamp');

  // Verify signature in production
  if (process.env.NODE_ENV === 'production' && process.env.SENDGRID_WEBHOOK_PUBLIC_KEY) {
    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const isValid = verifySignature(
      process.env.SENDGRID_WEBHOOK_PUBLIC_KEY,
      body,
      signature,
      timestamp
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  const events: SendGridEvent[] = JSON.parse(body);

  for (const event of events) {
    try {
      // Find the email_send record by SendGrid message ID
      const { rows } = await sql`
        SELECT id FROM email_sends
        WHERE sendgrid_message_id = ${event.sg_message_id}
      `;

      if (rows.length === 0) continue;

      const sendId = rows[0].id;

      // Insert event record
      await sql`
        INSERT INTO email_events (
          send_id, event_type, timestamp, ip_address, user_agent, url, reason, raw_payload
        ) VALUES (
          ${sendId},
          ${event.event},
          ${new Date(event.timestamp * 1000).toISOString()},
          ${event.ip || null},
          ${event.useragent || null},
          ${event.url || null},
          ${event.reason || null},
          ${JSON.stringify(event)}
        )
      `;

      // Update email_sends based on event type
      switch (event.event) {
        case 'delivered':
          await sql`
            UPDATE email_sends
            SET status = 'delivered', delivered_at = ${new Date(event.timestamp * 1000).toISOString()}
            WHERE id = ${sendId} AND status = 'sent'
          `;
          break;

        case 'open':
          await sql`
            UPDATE email_sends
            SET
              status = 'opened',
              open_count = open_count + 1,
              first_opened_at = COALESCE(first_opened_at, ${new Date(event.timestamp * 1000).toISOString()}),
              last_opened_at = ${new Date(event.timestamp * 1000).toISOString()}
            WHERE id = ${sendId}
          `;
          break;

        case 'click':
          await sql`
            UPDATE email_sends
            SET
              click_count = click_count + 1,
              first_clicked_at = COALESCE(first_clicked_at, ${new Date(event.timestamp * 1000).toISOString()})
            WHERE id = ${sendId}
          `;
          break;

        case 'bounce':
          const bounceType = event.bounce_classification || 'unknown';
          await sql`
            UPDATE email_sends
            SET status = 'bounced', error_message = ${event.reason}, bounce_type = ${bounceType}
            WHERE id = ${sendId}
          `;
          // Update contact status
          await sql`
            UPDATE email_contacts
            SET bounce_count = bounce_count + 1, status = CASE WHEN bounce_count >= 2 THEN 'bounced' ELSE status END
            WHERE id = (SELECT contact_id FROM email_sends WHERE id = ${sendId})
          `;
          break;

        case 'spamreport':
          await sql`UPDATE email_sends SET status = 'spam' WHERE id = ${sendId}`;
          await sql`
            UPDATE email_contacts SET status = 'complained'
            WHERE id = (SELECT contact_id FROM email_sends WHERE id = ${sendId})
          `;
          break;

        case 'unsubscribe':
          await sql`UPDATE email_sends SET status = 'unsubscribed' WHERE id = ${sendId}`;
          await sql`
            UPDATE email_contacts SET status = 'unsubscribed', unsubscribed_at = NOW()
            WHERE id = (SELECT contact_id FROM email_sends WHERE id = ${sendId})
          `;
          break;
      }

      // Update campaign stats (denormalized)
      await updateCampaignStats(sendId);

    } catch (error) {
      console.error('Error processing SendGrid event:', error);
    }
  }

  return NextResponse.json({ received: true });
}

async function updateCampaignStats(sendId: string) {
  await sql`
    UPDATE email_campaigns c
    SET
      delivered_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = c.id AND status IN ('delivered', 'opened')),
      opened_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = c.id AND status = 'opened'),
      clicked_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = c.id AND click_count > 0),
      bounced_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = c.id AND status = 'bounced'),
      complained_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = c.id AND status = 'spam'),
      unsubscribed_count = (SELECT COUNT(*) FROM email_sends WHERE campaign_id = c.id AND status = 'unsubscribed')
    WHERE c.id = (SELECT campaign_id FROM email_sends WHERE id = ${sendId})
  `;
}
```

---

## 7. Component Architecture

### File Structure

```
app/
├── admin/
│   └── campaigns/
│       ├── layout.tsx           # Campaigns layout with sidebar
│       ├── page.tsx             # Dashboard overview
│       │
│       ├── contacts/
│       │   ├── page.tsx         # Contacts list
│       │   ├── import/
│       │   │   └── page.tsx     # Import wizard
│       │   └── [id]/
│       │       └── page.tsx     # Contact detail (slide-in)
│       │
│       ├── categories/
│       │   └── page.tsx         # Category management
│       │
│       ├── templates/
│       │   ├── page.tsx         # Template list
│       │   ├── new/
│       │   │   └── page.tsx     # Create template
│       │   ├── [id]/
│       │   │   └── page.tsx     # Edit template
│       │   └── signatures/
│       │       └── page.tsx     # Manage signatures
│       │
│       ├── new/
│       │   └── page.tsx         # Create campaign wizard
│       │
│       ├── [id]/
│       │   ├── page.tsx         # Campaign detail
│       │   └── analytics/
│       │       └── page.tsx     # Campaign analytics
│       │
│       ├── analytics/
│       │   └── page.tsx         # Overall analytics
│       │
│       └── history/
│           └── page.tsx         # Send history
│
├── components/
│   └── campaigns/
│       ├── layout/
│       │   ├── campaigns-sidebar.tsx
│       │   ├── breadcrumb-nav.tsx
│       │   └── slide-in-panel.tsx
│       │
│       ├── contacts/
│       │   ├── contacts-table.tsx
│       │   ├── contact-card.tsx
│       │   ├── contact-form.tsx
│       │   ├── import-wizard.tsx
│       │   └── category-tree.tsx
│       │
│       ├── templates/
│       │   ├── template-editor.tsx
│       │   ├── template-preview.tsx
│       │   ├── variable-helper.tsx
│       │   └── signature-selector.tsx
│       │
│       ├── campaigns/
│       │   ├── campaign-builder.tsx
│       │   ├── recipient-selector.tsx
│       │   ├── campaign-card.tsx
│       │   └── send-progress.tsx
│       │
│       ├── analytics/
│       │   ├── stats-cards.tsx
│       │   ├── open-rate-chart.tsx
│       │   ├── click-heatmap.tsx
│       │   └── trend-chart.tsx
│       │
│       └── history/
│           ├── timeline.tsx
│           ├── timeline-item.tsx
│           └── email-detail-modal.tsx
│
├── lib/
│   └── campaigns/
│       ├── actions.ts           # Server actions
│       ├── queries.ts           # Database queries
│       ├── email-sender.ts      # SendGrid wrapper
│       └── types.ts             # TypeScript types
│
└── api/
    ├── admin/
    │   └── campaigns/
    │       ├── contacts/
    │       │   ├── route.ts
    │       │   └── import/
    │       │       └── route.ts
    │       ├── categories/
    │       │   └── route.ts
    │       ├── templates/
    │       │   ├── route.ts
    │       │   └── signatures/
    │       │       └── route.ts
    │       ├── route.ts
    │       ├── [id]/
    │       │   ├── route.ts
    │       │   ├── send/
    │       │   │   └── route.ts
    │       │   └── stats/
    │       │       └── route.ts
    │       ├── analytics/
    │       │   └── route.ts
    │       └── history/
    │           └── route.ts
    │
    └── webhooks/
        └── sendgrid/
            └── route.ts
```

### Shared Types

```typescript
// lib/campaigns/types.ts

export interface EmailCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  color: string;
  icon: string;
  sortOrder: number;
  contactCount?: number;
  children?: EmailCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailContact {
  id: string;
  email: string;
  name: string | null;
  organization: string | null;
  categoryId: string | null;
  categoryName?: string;
  metadata: Record<string, unknown>;
  tags: string[];
  notes: string | null;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  unsubscribedAt: Date | null;
  bounceCount: number;
  lastEmailedAt: Date | null;
  source: string;
  importedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  variables: string[];
  signatureId: string | null;
  category: string | null;
  isActive: boolean;
  isDefault: boolean;
  previewText: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSignature {
  id: string;
  name: string;
  description: string | null;
  html: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string | null;
  templateId: string | null;
  subjectOverride: string | null;
  bodyOverride: string | null;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  recipientType: 'category' | 'custom' | 'all';
  recipientCategoryIds: string[];
  recipientFilter: Record<string, unknown>;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
  scheduledAt: Date | null;
  startedAt: Date | null;
  completedAt: Date | null;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  complainedCount: number;
  unsubscribedCount: number;
  trackOpens: boolean;
  trackClicks: boolean;
  batchSize: number;
  delayBetweenMs: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailSend {
  id: string;
  campaignId: string;
  contactId: string | null;
  toEmail: string;
  toName: string | null;
  toOrganization: string | null;
  subject: string;
  sendgridMessageId: string | null;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'dropped' | 'spam' | 'unsubscribed';
  sentAt: Date | null;
  deliveredAt: Date | null;
  firstOpenedAt: Date | null;
  lastOpenedAt: Date | null;
  firstClickedAt: Date | null;
  openCount: number;
  clickCount: number;
  errorMessage: string | null;
  bounceType: string | null;
  createdAt: Date;
}

export interface CampaignStats {
  sent: number;
  delivered: number;
  deliveryRate: number;
  opened: number;
  openRate: number;
  clicked: number;
  clickRate: number;
  clickToOpenRate: number;
  bounced: number;
  bounceRate: number;
  complained: number;
  unsubscribed: number;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; message: string }[];
}
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Database schema and basic CRUD operations

1. **Database Setup**
   - [ ] Create migration file with all tables
   - [ ] Run migration on Vercel Postgres
   - [ ] Add indexes for performance

2. **Core API Routes**
   - [ ] `/api/admin/campaigns/contacts` - CRUD
   - [ ] `/api/admin/campaigns/categories` - CRUD
   - [ ] `/api/admin/campaigns/templates` - CRUD
   - [ ] Auth middleware for admin-only access

3. **Base Components**
   - [ ] Campaigns layout with sidebar
   - [ ] Breadcrumb navigation
   - [ ] Category tree component
   - [ ] Slide-in panel component

**Deliverables**: Working API, basic navigation structure

---

### Phase 2: Contact Management (Week 2-3)

**Goal**: Full contact list management with import

1. **Contacts Page**
   - [ ] Data table with TanStack Table
   - [ ] Search, filter, sort functionality
   - [ ] Row selection for bulk actions
   - [ ] Pagination

2. **Import Wizard**
   - [ ] File upload (CSV, JSON)
   - [ ] Column mapping interface
   - [ ] Duplicate detection
   - [ ] Category assignment
   - [ ] Progress indicator

3. **Contact Detail Panel**
   - [ ] Slide-in panel design
   - [ ] Edit form
   - [ ] Email history (placeholder)
   - [ ] Status management

4. **Category Management**
   - [ ] Tree view with drag-drop
   - [ ] Create/edit/delete categories
   - [ ] Color and icon selection

**Deliverables**: Fully functional contact management

---

### Phase 3: Templates & Campaigns (Week 3-4)

**Goal**: Template creation and campaign sending

1. **Template Editor**
   - [ ] Rich text editor (or markdown)
   - [ ] Variable insertion
   - [ ] Live preview
   - [ ] Signature selection

2. **Signature Manager**
   - [ ] Import existing signatures from `=6`
   - [ ] Preview signatures
   - [ ] Set default

3. **Campaign Builder**
   - [ ] Multi-step wizard
   - [ ] Recipient selection
   - [ ] Template selection
   - [ ] Settings configuration
   - [ ] Review & confirm

4. **Campaign Sending**
   - [ ] Queue management
   - [ ] Batch processing
   - [ ] Progress indicator
   - [ ] Pause/resume functionality

**Deliverables**: End-to-end campaign sending

---

### Phase 4: Analytics & Tracking (Week 4-5)

**Goal**: Real-time tracking and analytics

1. **SendGrid Webhook**
   - [ ] Webhook endpoint
   - [ ] Signature verification
   - [ ] Event processing
   - [ ] Status updates

2. **Analytics Dashboard**
   - [ ] Stats cards
   - [ ] Open rate chart
   - [ ] Click tracking
   - [ ] Trend analysis

3. **Campaign Analytics**
   - [ ] Per-campaign stats
   - [ ] Recipient breakdown
   - [ ] Timeline view

**Deliverables**: Real-time tracking, analytics dashboard

---

### Phase 5: History & Polish (Week 5-6)

**Goal**: History view and UX refinements

1. **History Timeline**
   - [ ] Chronological view
   - [ ] Filtering by campaign/status
   - [ ] Search by recipient
   - [ ] Export functionality

2. **Contact Email History**
   - [ ] Show in contact detail panel
   - [ ] Link to campaign

3. **UX Polish**
   - [ ] Loading states
   - [ ] Error handling
   - [ ] Toast notifications
   - [ ] Keyboard shortcuts
   - [ ] Mobile responsiveness

4. **Performance**
   - [ ] Optimize queries
   - [ ] Add caching where appropriate
   - [ ] Lazy loading for large lists

**Deliverables**: Complete, polished system

---

## 9. Performance Considerations

### Database Optimizations

1. **Indexes**
   - All foreign keys indexed
   - Status columns indexed for filtering
   - Email column indexed for lookups
   - Timestamp columns indexed for sorting

2. **Denormalization**
   - Campaign stats stored on campaign table
   - Contact count cached on category
   - Reduces JOIN queries for dashboards

3. **Pagination**
   - Default 50 items per page
   - Cursor-based pagination for large lists
   - Infinite scroll with virtualization

### Frontend Optimizations

1. **React Query**
   - Cache API responses
   - Optimistic updates for mutations
   - Background refetching

2. **Virtualization**
   - Use `@tanstack/react-virtual` for large lists
   - Render only visible rows

3. **Code Splitting**
   - Dynamic imports for campaign builder
   - Lazy load analytics charts

4. **Optimistic UI**
   - Immediate feedback on actions
   - Rollback on error

### SendGrid Best Practices

1. **Rate Limiting**
   - 1-2 second delay between emails
   - Batch size of 20-50
   - Monitor bounce rates

2. **Webhook Processing**
   - Async processing
   - Retry logic for failures
   - Queue for high volume

3. **Deliverability**
   - Warm up sending gradually
   - Monitor spam complaints
   - Automatic unsubscribe handling

---

## Appendix: Data Migration from =6

### Import Existing Data

```typescript
// Script to migrate data from =6 to new system

import { sql } from '@vercel/postgres';
import fs from 'fs';

async function migrateFromV0() {
  // 1. Create Imperial College category
  const { rows: [imperial] } = await sql`
    INSERT INTO email_categories (name, slug, color, icon)
    VALUES ('Imperial College', 'imperial-college', '#003E74', 'graduation-cap')
    RETURNING id
  `;

  // 2. Load categorized societies
  const data = JSON.parse(
    fs.readFileSync('./data/output/imperial_societies_lsn_categorized.json', 'utf-8')
  );

  // 3. Create sub-categories based on unique categories
  const categories = new Map<string, string>();
  for (const society of data.categorizedSocieties) {
    if (society.category && !categories.has(society.category)) {
      const { rows: [cat] } = await sql`
        INSERT INTO email_categories (name, slug, parent_id, color)
        VALUES (${society.category}, ${society.category.toLowerCase().replace(/\s+/g, '-')}, ${imperial.id}, '#6366f1')
        RETURNING id
      `;
      categories.set(society.category, cat.id);
    }
  }

  // 4. Import contacts
  for (const society of data.categorizedSocieties) {
    if (!society.email) continue;

    await sql`
      INSERT INTO email_contacts (
        email, name, organization, category_id, metadata, tags, source
      ) VALUES (
        ${society.email},
        ${society.name},
        ${society.name},
        ${categories.get(society.category) || imperial.id},
        ${JSON.stringify({
          memberCount: society.memberCount,
          website: society.website,
          instagram: society.instagram,
          relevanceScore: society.relevanceScore,
          outreachPriority: society.outreachPriority,
          targetAudience: society.targetAudience
        })},
        ${society.targetAudience || []},
        'v0_migration'
      )
      ON CONFLICT (email) DO NOTHING
    `;
  }

  console.log('Migration complete!');
}
```

### Import Existing Templates

```typescript
// Migrate signature designs from =6
import { SIGNATURE_DESIGNS } from '../=6/src/email-templates';

async function migrateSignatures() {
  for (const design of SIGNATURE_DESIGNS) {
    await sql`
      INSERT INTO email_signatures (name, description, html, is_default)
      VALUES (
        ${design.name},
        ${design.description},
        ${design.html},
        ${design.name === 'modern-minimal'}
      )
    `;
  }
}
```

---

## Summary

This design provides a comprehensive email campaign management system with:

- **Hierarchical contact organization** with categories and sub-categories
- **Intuitive import system** for CSV/JSON with duplicate handling
- **Template system** with variables and signature management
- **Campaign builder** with recipient selection and scheduling
- **Real-time analytics** via SendGrid webhooks
- **Beautiful history view** with timeline and filtering

The implementation is broken into 5 phases over ~6 weeks, building progressively from foundation to polish.

**Next Steps**:
1. Review and approve this design
2. Begin Phase 1 with database migration
3. Set up SendGrid webhook in production

---

*Document Version: 1.0*
*Created: January 2025*
*Author: Claude (with LSN context)*
