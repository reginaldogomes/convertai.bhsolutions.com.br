-- Instagram content management tables
-- Stores Instagram posts, stories, reels, and carousels

CREATE TABLE IF NOT EXISTS instagram_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    ig_user_id TEXT NOT NULL,
    ig_username TEXT NOT NULL DEFAULT '',
    access_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    page_id TEXT NOT NULL DEFAULT '',
    followers_count INTEGER NOT NULL DEFAULT 0,
    media_count INTEGER NOT NULL DEFAULT 0,
    connected_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id)
);

CREATE TABLE IF NOT EXISTS instagram_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'post' CHECK (type IN ('post', 'story', 'reel', 'carousel')),
    caption TEXT NOT NULL DEFAULT '',
    media_urls TEXT[] NOT NULL DEFAULT '{}',
    thumbnail_url TEXT,
    hashtags TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    ig_post_id TEXT,
    metrics JSONB NOT NULL DEFAULT '{"likes":0,"comments":0,"shares":0,"saves":0,"reach":0,"impressions":0,"engagement_rate":0}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instagram_contents_org ON instagram_contents(organization_id);
CREATE INDEX IF NOT EXISTS idx_instagram_contents_status ON instagram_contents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_instagram_contents_created ON instagram_contents(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_org ON instagram_accounts(organization_id);

-- RLS policies
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_contents ENABLE ROW LEVEL SECURITY;

-- instagram_accounts policies
CREATE POLICY "Users can view own org instagram account"
    ON instagram_accounts FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage own org instagram account"
    ON instagram_accounts FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- instagram_contents policies
CREATE POLICY "Users can view own org instagram contents"
    ON instagram_contents FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage own org instagram contents"
    ON instagram_contents FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));
