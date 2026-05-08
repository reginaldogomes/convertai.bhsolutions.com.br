-- ============================================================
-- 020: Updated plans — credits-first model
-- • Landing pages: unlimited (credits are the real limit)
-- • 1 site per org (enforced at app layer via max_sites = 1)
-- • New competitive BRL pricing
-- • New "business" tier replacing old enterprise structure
-- ============================================================

-- Allow 'business' as a valid plan ID.
-- The original inline CHECK was auto-named by Postgres; we find and drop it dynamically
-- so we never touch the PRIMARY KEY (which the organization_subscriptions FK depends on).
DO $$
DECLARE
    v_name TEXT;
BEGIN
    SELECT conname INTO v_name
    FROM pg_constraint
    WHERE conrelid = 'plans'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%starter%'
      AND pg_get_constraintdef(oid) NOT LIKE '%business%'
    LIMIT 1;

    IF v_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE plans DROP CONSTRAINT %I', v_name);
    END IF;
END $$;

ALTER TABLE plans ADD CONSTRAINT plans_id_check
    CHECK (id IN ('starter', 'pro', 'business', 'enterprise'));

-- ─── Update existing plans ───────────────────────────────────

UPDATE plans SET
    name                = 'Starter',
    description         = 'Para quem está começando. 1 site, landing pages ilimitadas por créditos.',
    price_brl           = 97.00,
    monthly_credits     = 500,
    max_contacts        = 2000,
    max_landing_pages   = -1,   -- ilimitado — créditos controlam a criação
    max_users           = 3,
    max_automations     = 5,
    max_sites           = 1,
    features            = '[
        "500 créditos/mês",
        "1 site",
        "Landing pages ilimitadas (por créditos)",
        "Até 2.000 contatos",
        "Até 3 usuários",
        "5 automações",
        "Chat com IA nas landing pages",
        "Campanhas WhatsApp e Email",
        "Suporte por email"
    ]'::jsonb,
    sort_order          = 1
WHERE id = 'starter';

UPDATE plans SET
    name                = 'Pro',
    description         = 'Para times em crescimento. Mais créditos, mais alcance.',
    price_brl           = 197.00,
    monthly_credits     = 2000,
    max_contacts        = 20000,
    max_landing_pages   = -1,
    max_users           = 10,
    max_automations     = 30,
    max_sites           = 1,
    features            = '[
        "2.000 créditos/mês",
        "1 site",
        "Landing pages ilimitadas (por créditos)",
        "Até 20.000 contatos",
        "Até 10 usuários",
        "30 automações",
        "Instagram automático",
        "Análise de produtos com IA",
        "Relatórios avançados",
        "Suporte prioritário"
    ]'::jsonb,
    sort_order          = 2
WHERE id = 'pro';

UPDATE plans SET
    name                = 'Enterprise',
    description         = 'Escala total. Créditos de alto volume, suporte dedicado.',
    price_brl           = 997.00,
    monthly_credits     = 20000,
    max_contacts        = -1,
    max_landing_pages   = -1,
    max_users           = -1,
    max_automations     = -1,
    max_sites           = 1,
    features            = '[
        "20.000 créditos/mês",
        "1 site",
        "Landing pages ilimitadas (por créditos)",
        "Contatos ilimitados",
        "Usuários ilimitados",
        "Automações ilimitadas",
        "Todos os recursos Pro",
        "SLA garantido",
        "Gerente de conta dedicado",
        "Onboarding personalizado"
    ]'::jsonb,
    sort_order          = 4
WHERE id = 'enterprise';

-- ─── Insert new Business tier ────────────────────────────────

INSERT INTO plans (id, name, description, price_brl, monthly_credits, max_contacts, max_landing_pages, max_users, max_automations, max_sites, features, sort_order)
VALUES (
    'business',
    'Business',
    'Para agências e operações avançadas. Alto volume de créditos.',
    397.00,
    5000,
    -1,
    -1,
    50,
    -1,
    1,
    '[
        "5.000 créditos/mês",
        "1 site",
        "Landing pages ilimitadas (por créditos)",
        "Contatos ilimitados",
        "Até 50 usuários",
        "Automações ilimitadas",
        "Todos os recursos Pro",
        "API avançada",
        "White-label parcial",
        "Suporte via chat"
    ]'::jsonb,
    3
)
ON CONFLICT (id) DO UPDATE SET
    name                = EXCLUDED.name,
    description         = EXCLUDED.description,
    price_brl           = EXCLUDED.price_brl,
    monthly_credits     = EXCLUDED.monthly_credits,
    max_contacts        = EXCLUDED.max_contacts,
    max_landing_pages   = EXCLUDED.max_landing_pages,
    max_users           = EXCLUDED.max_users,
    max_automations     = EXCLUDED.max_automations,
    max_sites           = EXCLUDED.max_sites,
    features            = EXCLUDED.features,
    sort_order          = EXCLUDED.sort_order;

-- ─── Update credit packs ─────────────────────────────────────

UPDATE credit_packs SET name = '200 Créditos',   credits = 200,   price_brl = 19.00 WHERE id = 'pack_500';
UPDATE credit_packs SET name = '1.000 Créditos', credits = 1000,  price_brl = 79.00 WHERE id = 'pack_2000';
UPDATE credit_packs SET name = '5.000 Créditos', credits = 5000,  price_brl = 297.00 WHERE id = 'pack_10000';

INSERT INTO credit_packs (id, name, credits, price_brl, sort_order)
VALUES ('pack_200', '200 Créditos', 200, 19.00, 1)
ON CONFLICT (id) DO UPDATE SET
    name      = EXCLUDED.name,
    credits   = EXCLUDED.credits,
    price_brl = EXCLUDED.price_brl;
