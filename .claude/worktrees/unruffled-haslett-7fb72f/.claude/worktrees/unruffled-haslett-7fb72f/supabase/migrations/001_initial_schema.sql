-- Antigravity CRM - Initial Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('owner','admin','agent','viewer')),
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_org" ON users
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  company         TEXT,
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX contacts_org_idx ON contacts(organization_id);
CREATE INDEX contacts_email_idx ON contacts(email) WHERE email IS NOT NULL;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_own_org" ON contacts
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- DEALS
-- ============================================================
CREATE TYPE pipeline_stage AS ENUM (
  'novo_lead','contato','proposta','negociacao','fechado_ganho','fechado_perdido'
);

CREATE TABLE deals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  pipeline_stage  pipeline_stage NOT NULL DEFAULT 'novo_lead',
  value           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','won','lost')),
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX deals_org_idx ON deals(organization_id);
CREATE INDEX deals_stage_idx ON deals(pipeline_stage);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deals_own_org" ON deals
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TYPE message_channel AS ENUM ('whatsapp', 'email');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel         message_channel NOT NULL,
  content         TEXT NOT NULL,
  direction       message_direction NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_org_idx ON messages(organization_id);
CREATE INDEX messages_contact_idx ON messages(contact_id);
CREATE INDEX messages_created_idx ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_own_org" ON messages
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  subject         TEXT NOT NULL DEFAULT '',
  body            TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent')),
  sent_at         TIMESTAMPTZ,
  metrics         JSONB NOT NULL DEFAULT '{"open_rate":0,"click_rate":0,"bounce_rate":0}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_own_org" ON campaigns
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- AUTOMATIONS
-- ============================================================
CREATE TABLE automations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  trigger_event   TEXT NOT NULL,
  workflow_json   JSONB NOT NULL DEFAULT '{"steps":[]}',
  active          BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automations_own_org" ON automations
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- Enable Realtime for messages (for WhatsApp inbox live updates)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
