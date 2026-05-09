-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 023: Instagram V2 — Token lifecycle, metrics sync, scheduling
-- ─────────────────────────────────────────────────────────────────────────────

-- ── instagram_accounts ────────────────────────────────────────────────────────

-- Track when the token was last successfully refreshed
ALTER TABLE instagram_accounts
    ADD COLUMN IF NOT EXISTS token_refreshed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS token_warning_sent_at TIMESTAMPTZ;

-- Index for the cron that checks expiring tokens
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_token_expires
    ON instagram_accounts (token_expires_at)
    WHERE token_expires_at IS NOT NULL;

-- ── instagram_contents ────────────────────────────────────────────────────────

-- Track when metrics were last synced from the Meta API
ALTER TABLE instagram_contents
    ADD COLUMN IF NOT EXISTS metrics_synced_at TIMESTAMPTZ;

-- Index for the scheduled-posts cron (status + time)
CREATE INDEX IF NOT EXISTS idx_instagram_contents_scheduled
    ON instagram_contents (status, scheduled_at)
    WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

-- Index for the metrics-sync cron (published posts within a time window)
CREATE INDEX IF NOT EXISTS idx_instagram_contents_published_metrics
    ON instagram_contents (organization_id, published_at)
    WHERE status = 'published' AND ig_post_id IS NOT NULL;
