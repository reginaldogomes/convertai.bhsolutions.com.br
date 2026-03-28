-- ============================================================
-- PLANS & USAGE LIMITS
-- ============================================================

-- Plans table: configurable by super admin via admin panel
CREATE TABLE plans (
    id                      TEXT PRIMARY KEY CHECK (id IN ('free','starter','pro','enterprise')),
    name                    TEXT NOT NULL,
    landing_pages_limit     INTEGER NOT NULL DEFAULT 1,   -- -1 = unlimited
    contacts_limit          INTEGER NOT NULL DEFAULT 100,
    emails_monthly_limit    INTEGER NOT NULL DEFAULT 500,
    whatsapp_monthly_limit  INTEGER NOT NULL DEFAULT 0,
    automations_limit       INTEGER NOT NULL DEFAULT 1,
    knowledge_base_limit    INTEGER NOT NULL DEFAULT 0,
    price_brl               NUMERIC(10,2) NOT NULL DEFAULT 0,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
-- Plans are publicly readable (app needs them for display)
CREATE POLICY "plans_readable_by_authenticated" ON plans
    FOR SELECT TO authenticated USING (true);

-- ============================================================
-- PER-ORG PLAN OVERRIDES
-- ============================================================
-- Super admin can set custom limits for individual organizations
-- (e.g. trial extension, special deal, etc.)
CREATE TABLE organization_plan_overrides (
    organization_id         UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    landing_pages_limit     INTEGER,   -- NULL = use plan default
    contacts_limit          INTEGER,
    emails_monthly_limit    INTEGER,
    whatsapp_monthly_limit  INTEGER,
    automations_limit       INTEGER,
    knowledge_base_limit    INTEGER,
    notes                   TEXT,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE organization_plan_overrides ENABLE ROW LEVEL SECURITY;
-- Org members can see their own overrides
CREATE POLICY "overrides_own_org" ON organization_plan_overrides
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- ============================================================
-- EFFECTIVE LIMITS VIEW
-- Merges plan defaults with per-org overrides (COALESCE)
-- ============================================================
CREATE VIEW organization_effective_limits AS
SELECT
    o.id        AS organization_id,
    o.plan,
    COALESCE(ov.landing_pages_limit,    p.landing_pages_limit)    AS landing_pages_limit,
    COALESCE(ov.contacts_limit,         p.contacts_limit)         AS contacts_limit,
    COALESCE(ov.emails_monthly_limit,   p.emails_monthly_limit)   AS emails_monthly_limit,
    COALESCE(ov.whatsapp_monthly_limit, p.whatsapp_monthly_limit) AS whatsapp_monthly_limit,
    COALESCE(ov.automations_limit,      p.automations_limit)      AS automations_limit,
    COALESCE(ov.knowledge_base_limit,   p.knowledge_base_limit)   AS knowledge_base_limit
FROM organizations o
JOIN plans p ON p.id = o.plan
LEFT JOIN organization_plan_overrides ov ON ov.organization_id = o.id;

-- ============================================================
-- DEFAULT PLAN CONFIGURATIONS
-- ============================================================
INSERT INTO plans (id, name, landing_pages_limit, contacts_limit, emails_monthly_limit, whatsapp_monthly_limit, automations_limit, knowledge_base_limit, price_brl)
VALUES
    ('free',       'Free',       1,   100,   500,    0,    1,  0,  0.00),
    ('starter',    'Starter',    5,   1000,  5000,   500,  5,  10, 97.00),
    ('pro',        'Pro',        20,  10000, 50000,  2000, 20, 50, 297.00),
    ('enterprise', 'Enterprise', -1,  -1,    -1,     -1,   -1, -1, 997.00);
