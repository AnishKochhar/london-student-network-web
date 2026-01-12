-- ============================================
-- EMAIL CAMPAIGNS SYSTEM
-- Migration 011: Add email campaign management tables
-- ============================================

-- Email Categories (Hierarchical - e.g., Imperial > Tech > AI Societies)
CREATE TABLE IF NOT EXISTS email_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES email_categories(id) ON DELETE SET NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'folder',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_categories_parent ON email_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_email_categories_slug ON email_categories(slug);

-- Email Contacts
CREATE TABLE IF NOT EXISTS email_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  organization VARCHAR(255),
  category_id UUID REFERENCES email_categories(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  unsubscribed_at TIMESTAMPTZ,
  bounce_count INT DEFAULT 0,
  last_emailed_at TIMESTAMPTZ,
  source VARCHAR(100) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_contacts_category ON email_contacts(category_id);
CREATE INDEX IF NOT EXISTS idx_email_contacts_status ON email_contacts(status);
CREATE INDEX IF NOT EXISTS idx_email_contacts_email ON email_contacts(email);

-- Email Signatures
CREATE TABLE IF NOT EXISTS email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255),
  html TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[] DEFAULT '{}',
  signature_id UUID REFERENCES email_signatures(id) ON DELETE SET NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  preview_text VARCHAR(200),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

-- Email Campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  subject_override VARCHAR(500),
  body_override TEXT,
  from_email VARCHAR(255) DEFAULT 'hello@londonstudentnetwork.com',
  from_name VARCHAR(255) DEFAULT 'London Student Network',
  reply_to VARCHAR(255) DEFAULT 'hello@londonstudentnetwork.com',
  recipient_type VARCHAR(20) DEFAULT 'category' CHECK (recipient_type IN ('category', 'custom', 'all')),
  recipient_category_ids UUID[] DEFAULT '{}',
  recipient_filter JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Denormalized stats
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
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created ON email_campaigns(created_at DESC);

-- Email Sends (Individual email records)
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES email_contacts(id) ON DELETE SET NULL,
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  to_organization VARCHAR(255),
  subject VARCHAR(500) NOT NULL,
  sendgrid_message_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'dropped', 'spam', 'unsubscribed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  first_opened_at TIMESTAMPTZ,
  last_opened_at TIMESTAMPTZ,
  first_clicked_at TIMESTAMPTZ,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  error_message TEXT,
  bounce_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_contact ON email_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_sendgrid_id ON email_sends(sendgrid_message_id);

-- Email Events (SendGrid Webhook Events)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_id UUID REFERENCES email_sends(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  url TEXT,
  reason TEXT,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_send ON email_events(send_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON email_events(timestamp DESC);

-- Insert default signatures (from the =6 system)
INSERT INTO email_signatures (name, description, html, is_default) VALUES
('Modern Minimal', 'Clean, modern design with subtle colors', '
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #000000;">
  <tr>
    <td style="padding: 20px 0 10px 0;">
      <div style="font-size: 16px; font-weight: 600; color: #000000; margin-bottom: 4px;">Josh</div>
      <div style="font-size: 13px; color: #000000; margin-bottom: 16px;">
        Founder, <a href="https://www.londonstudentnetwork.com" style="color: #000000; text-decoration: none;">London Student Network</a>
      </div>
    </td>
  </tr>
  <tr>
    <td style="border-top: 2px solid #4F46E5; padding-top: 16px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 6px 0;">
            <span style="color: #4F46E5; font-weight: 600; font-size: 12px; margin-right: 6px;">Website</span>
            <a href="https://www.londonstudentnetwork.com" style="color: #666; text-decoration: none; font-size: 13px;">londonstudentnetwork.com</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">
            <span style="color: #E1306C; font-weight: 600; font-size: 12px; margin-right: 6px;">Instagram</span>
            <a href="https://www.instagram.com/lsn.uk/" style="color: #666; text-decoration: none; font-size: 13px;">@lsn.uk</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">
            <span style="color: #0A66C2; font-weight: 600; font-size: 12px; margin-right: 6px;">LinkedIn</span>
            <a href="https://www.linkedin.com/company/london-student-network" style="color: #666; text-decoration: none; font-size: 13px;">London Student Network</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-top: 12px; font-size: 12px; color: #999;">
      500,000+ students | 20+ universities | 100+ societies
    </td>
  </tr>
</table>', true),
('Professional Card', 'Business card style with organized layout', '
<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, Helvetica, Arial, sans-serif; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; max-width: 500px; margin-top: 16px;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 12px;">
            <div style="font-size: 17px; font-weight: 700; color: #111827;">Josh</div>
            <div style="font-size: 14px; color: #6B7280; margin-top: 2px;">Founder</div>
            <div style="font-size: 15px; font-weight: 600; color: #4F46E5; margin-top: 4px;">London Student Network</div>
          </td>
        </tr>
        <tr>
          <td style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 6px 0;">
                  <a href="https://www.londonstudentnetwork.com" style="color: #4F46E5; text-decoration: none; font-size: 13px;">londonstudentnetwork.com</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0;">
                  <a href="mailto:hello@londonstudentnetwork.com" style="color: #111827; text-decoration: none; font-size: 13px;">hello@londonstudentnetwork.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>', false);
