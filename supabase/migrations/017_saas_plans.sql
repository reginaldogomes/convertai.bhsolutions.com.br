-- ============================================================
-- 017: SaaS Plans, Subscriptions & Credits
-- 3 paid plans (Starter, Pro, Enterprise) — no free tier
-- Credit system: monthly allocation + purchasable packs
-- ============================================================

-- ─── Plans ──────────────────────────────────────────────────

CREATE TABLE plans (
    id                  TEXT PRIMARY KEY CHECK (id IN ('starter', 'pro', 'enterprise')),
    name                TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    price_brl           NUMERIC(10,2) NOT NULL,
    monthly_credits     INTEGER NOT NULL CHECK (monthly_credits > 0),
    max_contacts        INTEGER NOT NULL DEFAULT -1,   -- -1 = unlimited
    max_landing_pages   INTEGER NOT NULL DEFAULT -1,
    max_users           INTEGER NOT NULL DEFAULT -1,
    max_automations     INTEGER NOT NULL DEFAULT -1,
    features            JSONB NOT NULL DEFAULT '[]',
    is_active           BOOLEAN NOT NULL DEFAULT true,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_readable_by_authenticated" ON plans
    FOR SELECT TO authenticated USING (true);

-- ─── Subscriptions ──────────────────────────────────────────

CREATE TABLE organization_subscriptions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id         UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id                 TEXT NOT NULL REFERENCES plans(id),
    status                  TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own_org" ON organization_subscriptions
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE INDEX idx_org_subscriptions_plan ON organization_subscriptions(plan_id);
CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status);

-- ─── Credits balance (inline on organizations) ───────────────

ALTER TABLE organizations
    ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 0 CHECK (credits_balance >= 0);

-- ─── Credit transactions (audit log) ────────────────────────

CREATE TABLE credit_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    amount          INTEGER NOT NULL,  -- positive = added, negative = consumed
    type            TEXT NOT NULL CHECK (type IN (
        'plan_renewal', 'purchase', 'usage_ai', 'usage_whatsapp',
        'usage_sms', 'usage_email', 'admin_grant', 'admin_deduct', 'refund'
    )),
    description     TEXT NOT NULL,
    reference_id    TEXT,              -- e.g., campaign_id, request_id, pack_id
    balance_after   INTEGER NOT NULL CHECK (balance_after >= 0),
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_transactions_own_org" ON credit_transactions
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE INDEX idx_credit_transactions_org_date ON credit_transactions(organization_id, created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(organization_id, type);

-- ─── Credit packs (purchasable) ─────────────────────────────

CREATE TABLE credit_packs (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    credits     INTEGER NOT NULL CHECK (credits > 0),
    price_brl   NUMERIC(10,2) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_packs_readable_by_authenticated" ON credit_packs
    FOR SELECT TO authenticated USING (true);

-- ─── Trigger: update organization_subscriptions.updated_at ──

CREATE OR REPLACE FUNCTION touch_organization_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_touch_org_subscriptions_updated_at
BEFORE UPDATE ON organization_subscriptions
FOR EACH ROW EXECUTE FUNCTION touch_organization_subscriptions_updated_at();

-- ─── RPC: consume_credits (atomic, returns false if insufficient) ──

CREATE OR REPLACE FUNCTION consume_credits(
    p_org_id        UUID,
    p_amount        INTEGER,
    p_type          TEXT,
    p_description   TEXT,
    p_reference_id  TEXT    DEFAULT NULL,
    p_created_by    UUID    DEFAULT NULL
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_balance       INTEGER;
    v_new_balance   INTEGER;
BEGIN
    IF p_amount <= 0 THEN
        RETURN TRUE; -- nothing to consume
    END IF;

    SELECT credits_balance INTO v_balance
    FROM organizations
    WHERE id = p_org_id
    FOR UPDATE;

    IF v_balance < p_amount THEN
        RETURN FALSE;
    END IF;

    v_new_balance := v_balance - p_amount;

    UPDATE organizations SET credits_balance = v_new_balance WHERE id = p_org_id;

    INSERT INTO credit_transactions
        (organization_id, amount, type, description, reference_id, balance_after, created_by)
    VALUES
        (p_org_id, -p_amount, p_type, p_description, p_reference_id, v_new_balance, p_created_by);

    RETURN TRUE;
END;
$$;

-- ─── RPC: add_credits (atomic, always succeeds) ──────────────

CREATE OR REPLACE FUNCTION add_credits(
    p_org_id        UUID,
    p_amount        INTEGER,
    p_type          TEXT,
    p_description   TEXT,
    p_reference_id  TEXT    DEFAULT NULL,
    p_created_by    UUID    DEFAULT NULL
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_new_balance INTEGER;
BEGIN
    IF p_amount <= 0 THEN
        SELECT credits_balance INTO v_new_balance FROM organizations WHERE id = p_org_id;
        RETURN v_new_balance;
    END IF;

    UPDATE organizations
    SET credits_balance = credits_balance + p_amount
    WHERE id = p_org_id
    RETURNING credits_balance INTO v_new_balance;

    INSERT INTO credit_transactions
        (organization_id, amount, type, description, reference_id, balance_after, created_by)
    VALUES
        (p_org_id, p_amount, p_type, p_description, p_reference_id, v_new_balance, p_created_by);

    RETURN v_new_balance;
END;
$$;

-- ─── Default plan data ───────────────────────────────────────

INSERT INTO plans (id, name, description, price_brl, monthly_credits, max_contacts, max_landing_pages, max_users, max_automations, features, sort_order)
VALUES
    (
        'starter',
        'Starter',
        'Ideal para pequenas equipes que querem começar a automatizar.',
        197.00,
        1000,
        2000,
        10,
        5,
        10,
        '[
            "1.000 créditos por mês",
            "Até 2.000 contatos",
            "Até 10 landing pages",
            "Até 5 usuários",
            "10 automações",
            "Chat com IA nas landing pages",
            "Campanhas WhatsApp e Email",
            "Suporte por email"
        ]'::jsonb,
        1
    ),
    (
        'pro',
        'Pro',
        'Para equipes em crescimento com necessidades avançadas de automação.',
        397.00,
        5000,
        20000,
        50,
        15,
        50,
        '[
            "5.000 créditos por mês",
            "Até 20.000 contatos",
            "Até 50 landing pages",
            "Até 15 usuários",
            "50 automações",
            "Instagram automático",
            "Análise de produtos com IA",
            "Relatórios avançados",
            "Suporte prioritário"
        ]'::jsonb,
        2
    ),
    (
        'enterprise',
        'Enterprise',
        'Escala total com recursos exclusivos e suporte dedicado.',
        997.00,
        20000,
        -1,
        -1,
        -1,
        -1,
        '[
            "20.000 créditos por mês",
            "Contatos ilimitados",
            "Landing pages ilimitadas",
            "Usuários ilimitados",
            "Automações ilimitadas",
            "Todos os recursos Pro",
            "SLA garantido",
            "Gerente de conta dedicado",
            "Onboarding personalizado"
        ]'::jsonb,
        3
    );

-- ─── Default credit packs ────────────────────────────────────

INSERT INTO credit_packs (id, name, credits, price_brl, sort_order)
VALUES
    ('pack_500',   '500 Créditos',     500,   29.00,  1),
    ('pack_2000',  '2.000 Créditos',  2000,   99.00,  2),
    ('pack_10000', '10.000 Créditos', 10000, 399.00,  3);
