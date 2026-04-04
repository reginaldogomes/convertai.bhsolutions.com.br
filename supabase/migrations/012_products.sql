-- Products & Services catalog
-- Central data source for landing pages, AI agent, and campaigns

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'product' CHECK (type IN ('product','service')),
  short_description TEXT NOT NULL DEFAULT '',
  full_description  TEXT NOT NULL DEFAULT '',
  price             NUMERIC(12,2),
  price_type        TEXT CHECK (price_type IN ('one_time','monthly','yearly','custom')),
  currency          TEXT NOT NULL DEFAULT 'BRL',
  features_json     JSONB NOT NULL DEFAULT '[]',
  benefits_json     JSONB NOT NULL DEFAULT '[]',
  faqs_json         JSONB NOT NULL DEFAULT '[]',
  target_audience   TEXT NOT NULL DEFAULT '',
  differentials     TEXT NOT NULL DEFAULT '',
  tags              TEXT[] NOT NULL DEFAULT '{}',
  images            TEXT[] NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  metadata_json     JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Slug unique per organization
CREATE UNIQUE INDEX products_org_slug_idx ON products(organization_id, slug);
CREATE INDEX products_org_idx ON products(organization_id);
CREATE INDEX products_status_idx ON products(organization_id, status);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_own_org" ON products
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- LINK: Landing Pages → Products (optional)
-- ============================================================
ALTER TABLE landing_pages ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX landing_pages_product_idx ON landing_pages(product_id) WHERE product_id IS NOT NULL;

-- ============================================================
-- LINK: Knowledge Base → Products (optional)
-- ============================================================
ALTER TABLE knowledge_base ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX knowledge_base_product_idx ON knowledge_base(product_id) WHERE product_id IS NOT NULL;
