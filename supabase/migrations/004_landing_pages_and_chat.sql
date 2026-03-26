-- Landing Pages, Knowledge Base (RAG), Chat Sessions & Analytics
-- Enables AI-powered landing pages with chatbot, lead capture and analytics

-- Enable pgvector for embedding similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- LANDING PAGES
-- ============================================================
CREATE TABLE landing_pages (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL UNIQUE,
  headline                TEXT NOT NULL DEFAULT '',
  subheadline             TEXT NOT NULL DEFAULT '',
  cta_text                TEXT NOT NULL DEFAULT 'Fale conosco',
  config_json             JSONB NOT NULL DEFAULT '{"theme":"light","primaryColor":"#6366f1","logoUrl":null}',
  chatbot_name            TEXT NOT NULL DEFAULT 'Assistente',
  chatbot_welcome_message TEXT NOT NULL DEFAULT 'Olá! Como posso ajudar?',
  chatbot_system_prompt   TEXT NOT NULL DEFAULT 'Você é um assistente útil. Responda com base no contexto fornecido.',
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX landing_pages_org_idx ON landing_pages(organization_id);
CREATE INDEX landing_pages_slug_idx ON landing_pages(slug) WHERE status = 'published';

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_pages_own_org" ON landing_pages
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- KNOWLEDGE BASE (for RAG)
-- ============================================================
CREATE TABLE knowledge_base (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  embedding       vector(1536),
  metadata_json   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX knowledge_base_org_idx ON knowledge_base(organization_id);
CREATE INDEX knowledge_base_page_idx ON knowledge_base(landing_page_id) WHERE landing_page_id IS NOT NULL;

-- HNSW index for fast similarity search
CREATE INDEX knowledge_base_embedding_idx ON knowledge_base
  USING hnsw (embedding vector_cosine_ops);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "knowledge_base_own_org" ON knowledge_base
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(1536),
  match_org_id UUID,
  match_page_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE kb.organization_id = match_org_id
    AND (match_page_id IS NULL OR kb.landing_page_id = match_page_id)
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
CREATE TABLE chat_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  visitor_id      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','lead_captured','closed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_sessions_page_idx ON chat_sessions(landing_page_id);
CREATE INDEX chat_sessions_visitor_idx ON chat_sessions(visitor_id);
CREATE INDEX chat_sessions_contact_idx ON chat_sessions(contact_id) WHERE contact_id IS NOT NULL;

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_sessions_own_org" ON chat_sessions
  USING (landing_page_id IN (
    SELECT id FROM landing_pages WHERE organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));

-- ============================================================
-- CHAT MESSAGES (separate table for proper indexing)
-- ============================================================
CREATE TABLE chat_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_messages_session_idx ON chat_messages(session_id);
CREATE INDEX chat_messages_created_idx ON chat_messages(created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_own_org" ON chat_messages
  USING (session_id IN (
    SELECT cs.id FROM chat_sessions cs
    JOIN landing_pages lp ON lp.id = cs.landing_page_id
    WHERE lp.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  ));

-- ============================================================
-- PAGE ANALYTICS
-- ============================================================
CREATE TABLE page_analytics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landing_page_id UUID NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN ('view','chat_start','lead_captured','cta_click')),
  session_id      UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  visitor_id      TEXT,
  metadata_json   JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX page_analytics_page_idx ON page_analytics(landing_page_id);
CREATE INDEX page_analytics_event_idx ON page_analytics(event_type);
CREATE INDEX page_analytics_created_idx ON page_analytics(created_at DESC);

ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_analytics_own_org" ON page_analytics
  USING (landing_page_id IN (
    SELECT id FROM landing_pages WHERE organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  ));
