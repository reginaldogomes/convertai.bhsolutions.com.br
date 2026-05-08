-- Adiciona campos de configuração avançada na tabela sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS config_json jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS primary_color varchar(7) DEFAULT '#3b82f6';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS logo_url varchar(2048);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS theme varchar(20) DEFAULT 'light';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'draft';

-- Tabela para Knowledge Base específica por site (RAG segmentado)
CREATE TABLE IF NOT EXISTS site_knowledge_base (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    title varchar(255) NOT NULL,
    content text NOT NULL,
    source varchar(100) DEFAULT 'manual', -- 'manual', 'imported', 'generated'
    
    embedding vector(768),
    metadata_json jsonb DEFAULT '{}'::jsonb,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Políticas RLS para site_knowledge_base
ALTER TABLE site_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view site_knowledge_base from their organization"
    ON site_knowledge_base FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can insert site_knowledge_base for their organization"
    ON site_knowledge_base FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can update their organization site_knowledge_base"
    ON site_knowledge_base FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can delete their organization site_knowledge_base"
    ON site_knowledge_base FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
    ));

-- Indices para performance de busca na base vetorial
CREATE INDEX IF NOT EXISTS idx_site_kb_org ON site_knowledge_base(organization_id);
CREATE INDEX IF NOT EXISTS idx_site_kb_site ON site_knowledge_base(site_id);
-- CREATE INDEX ON site_knowledge_base USING hnsw (embedding vector_cosine_ops); (Comentado para dev local mais rápido, dependendo de setup hnsw)
