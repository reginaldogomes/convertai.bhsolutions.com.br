-- Migration: campaign_recipients
-- Rastreamento por destinatário para campanhas (WhatsApp, SMS, Email)

CREATE TYPE campaign_recipient_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'delivered',
    'read'
);

CREATE TABLE campaign_recipients (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id          UUID REFERENCES contacts(id) ON DELETE SET NULL,
    contact_name        TEXT NOT NULL DEFAULT '',
    recipient_address   TEXT NOT NULL,          -- email ou telefone (snapshot no momento do envio)
    status              campaign_recipient_status NOT NULL DEFAULT 'pending',
    twilio_sid          TEXT,                   -- MessageSid do Twilio (WhatsApp/SMS apenas)
    error_message       TEXT,
    sent_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    read_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frequentes
CREATE INDEX idx_campaign_recipients_campaign_id   ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_org_id        ON campaign_recipients(organization_id);
CREATE INDEX idx_campaign_recipients_twilio_sid    ON campaign_recipients(twilio_sid) WHERE twilio_sid IS NOT NULL;
CREATE INDEX idx_campaign_recipients_status        ON campaign_recipients(campaign_id, status);

-- RLS
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Apenas service_role (admin client) acessa esta tabela
CREATE POLICY "service_role_all" ON campaign_recipients
    FOR ALL TO service_role USING (true) WITH CHECK (true);
