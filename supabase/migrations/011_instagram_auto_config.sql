-- Instagram auto-content configuration
-- Stores niche, tone, frequency, and content preferences for AI-powered auto-generation

CREATE TABLE IF NOT EXISTS instagram_auto_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT false,
    niche TEXT NOT NULL DEFAULT '',
    brand_description TEXT NOT NULL DEFAULT '',
    target_audience TEXT NOT NULL DEFAULT '',
    tone TEXT NOT NULL DEFAULT 'profissional',
    language TEXT NOT NULL DEFAULT 'pt-BR',
    content_types TEXT[] NOT NULL DEFAULT '{post,reel}',
    objectives TEXT[] NOT NULL DEFAULT '{engajamento,autoridade}',
    posts_per_week INTEGER NOT NULL DEFAULT 3 CHECK (posts_per_week BETWEEN 1 AND 14),
    hashtag_strategy TEXT NOT NULL DEFAULT 'mix' CHECK (hashtag_strategy IN ('trending', 'niche', 'branded', 'mix')),
    default_hashtags TEXT[] NOT NULL DEFAULT '{}',
    visual_style TEXT NOT NULL DEFAULT 'moderno',
    cta_style TEXT NOT NULL DEFAULT 'sutil',
    avoid_topics TEXT NOT NULL DEFAULT '',
    reference_profiles TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_instagram_auto_configs_org ON instagram_auto_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_instagram_auto_configs_active ON instagram_auto_configs(active) WHERE active = true;

-- RLS policies
ALTER TABLE instagram_auto_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org instagram auto config"
    ON instagram_auto_configs FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can manage own org instagram auto config"
    ON instagram_auto_configs FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));
