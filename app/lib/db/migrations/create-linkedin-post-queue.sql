-- LinkedIn Post Queue Table
-- Stores draft and published LinkedIn posts for approval workflow

CREATE TABLE IF NOT EXISTS linkedin_post_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_content TEXT NOT NULL,
  event_ids TEXT[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by VARCHAR(255),
  published_at TIMESTAMPTZ,
  rejection_reason TEXT,
  linkedin_post_id VARCHAR(255), -- LinkedIn's post ID after publishing
  auto_approved BOOLEAN DEFAULT false,
  -- Metadata
  event_data JSONB, -- Store event snapshot for reference
  error_log TEXT -- Store any errors during publishing
);

-- Index for querying pending postsa
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_status ON linkedin_post_queue(status);
CREATE INDEX IF NOT EXISTS idx_linkedin_queue_created_at ON linkedin_post_queue(created_at DESC);

-- Track which events have been featured in LinkedIn posts
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured_in_linkedin_post BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS last_linkedin_feature_date TIMESTAMPTZ;
