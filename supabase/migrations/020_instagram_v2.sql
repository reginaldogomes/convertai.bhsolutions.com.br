-- Instagram v2: token refresh tracking, metrics sync, scheduling index

-- Token lifecycle tracking
ALTER TABLE instagram_accounts
    ADD COLUMN IF NOT EXISTS token_refreshed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS token_warning_sent_at TIMESTAMPTZ;

-- Per-post metrics sync timestamp
ALTER TABLE instagram_contents
    ADD COLUMN IF NOT EXISTS metrics_synced_at TIMESTAMPTZ;

-- Fast lookup for scheduled posts cron
CREATE INDEX IF NOT EXISTS idx_instagram_contents_scheduled
    ON instagram_contents(scheduled_at)
    WHERE status = 'scheduled';

-- Fast lookup for published posts needing metrics sync
CREATE INDEX IF NOT EXISTS idx_instagram_contents_needs_metrics
    ON instagram_contents(published_at)
    WHERE status = 'published' AND ig_post_id IS NOT NULL;

-- Token expiry index for refresh cron
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_token_expires
    ON instagram_accounts(token_expires_at);
