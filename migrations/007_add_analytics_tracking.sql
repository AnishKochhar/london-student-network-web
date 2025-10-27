-- Analytics Tracking Tables
-- Storage-optimized schema for tracking event interactions

-- Table for tracking event page views
CREATE TABLE IF NOT EXISTS event_page_views (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    referrer_domain VARCHAR(100), -- Only store domain, not full URL
    utm_source VARCHAR(50),
    utm_medium VARCHAR(50),
    utm_campaign VARCHAR(50),
    device_type SMALLINT, -- 0=desktop, 1=mobile, 2=tablet
    is_unique_visitor BOOLEAN DEFAULT true -- Daily unique tracking
);

-- Index for fast queries by event and date
CREATE INDEX idx_event_page_views_event_date ON event_page_views(event_id, viewed_at DESC);
CREATE INDEX idx_event_page_views_date ON event_page_views(viewed_at DESC);

-- Table for tracking clicks on external registration links
CREATE TABLE IF NOT EXISTS event_external_clicks (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    click_source VARCHAR(20) -- 'event_page', 'email', 'modal'
);

-- Index for fast queries
CREATE INDEX idx_event_external_clicks_event_date ON event_external_clicks(event_id, clicked_at DESC);

-- Table for storing aggregated daily statistics (reduces query load)
CREATE TABLE IF NOT EXISTS event_daily_stats (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    total_views INT DEFAULT 0,
    unique_views INT DEFAULT 0,
    mobile_views INT DEFAULT 0,
    desktop_views INT DEFAULT 0,
    external_clicks INT DEFAULT 0,
    registrations INT DEFAULT 0, -- Track registrations per day
    UNIQUE(event_id, stat_date)
);

-- Index for fast queries
CREATE INDEX idx_event_daily_stats_event_date ON event_daily_stats(event_id, stat_date DESC);

-- Table for tracking referrer domains (for admin analytics)
CREATE TABLE IF NOT EXISTS referrer_stats (
    id SERIAL PRIMARY KEY,
    referrer_domain VARCHAR(100) NOT NULL,
    total_views INT DEFAULT 0,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(referrer_domain)
);

-- Function to automatically update daily stats (called by cron or trigger)
CREATE OR REPLACE FUNCTION update_daily_stats(target_event_id UUID, target_date DATE)
RETURNS void AS $$
BEGIN
    INSERT INTO event_daily_stats (event_id, stat_date, total_views, unique_views, mobile_views, desktop_views, external_clicks, registrations)
    SELECT
        target_event_id,
        target_date,
        COUNT(*) as total_views,
        COUNT(DISTINCT CASE WHEN is_unique_visitor THEN user_id END) as unique_views,
        COUNT(CASE WHEN device_type = 1 THEN 1 END) as mobile_views,
        COUNT(CASE WHEN device_type = 0 THEN 1 END) as desktop_views,
        (SELECT COUNT(*) FROM event_external_clicks WHERE event_id = target_event_id AND clicked_at::date = target_date) as external_clicks,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = target_event_id AND created_at::date = target_date) as registrations
    FROM event_page_views
    WHERE event_id = target_event_id AND viewed_at::date = target_date
    ON CONFLICT (event_id, stat_date)
    DO UPDATE SET
        total_views = EXCLUDED.total_views,
        unique_views = EXCLUDED.unique_views,
        mobile_views = EXCLUDED.mobile_views,
        desktop_views = EXCLUDED.desktop_views,
        external_clicks = EXCLUDED.external_clicks,
        registrations = EXCLUDED.registrations;
END;
$$ LANGUAGE plpgsql;

-- Data retention policy: Auto-delete raw view data older than 90 days (keep aggregated stats)
-- This keeps storage minimal while retaining useful historical data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
    -- Delete raw page views older than 90 days
    DELETE FROM event_page_views WHERE viewed_at < NOW() - INTERVAL '90 days';

    -- Delete raw click data older than 90 days
    DELETE FROM event_external_clicks WHERE clicked_at < NOW() - INTERVAL '90 days';

    -- Keep daily stats forever (they're tiny)
END;
$$ LANGUAGE plpgsql;

-- Optional: Set up automatic cleanup (uncomment if you want weekly cleanup)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * 0', 'SELECT cleanup_old_analytics_data()');

-- Grant necessary permissions
GRANT SELECT, INSERT ON event_page_views TO PUBLIC;
GRANT SELECT, INSERT ON event_external_clicks TO PUBLIC;
GRANT SELECT ON event_daily_stats TO PUBLIC;
GRANT SELECT ON referrer_stats TO PUBLIC;
