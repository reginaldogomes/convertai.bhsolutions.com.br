-- ============================================================
-- 019: Multi-org memberships
-- Allows a user to belong to (and switch between) multiple
-- organizations. users.organization_id keeps working as the
-- "active" org so every existing query stays untouched.
-- ============================================================

-- ─── 1. org_memberships junction table ──────────────────────

CREATE TABLE org_memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'owner'
        CHECK (role IN ('owner', 'admin', 'agent', 'viewer')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, organization_id)
);

CREATE INDEX idx_org_memberships_user    ON org_memberships(user_id);
CREATE INDEX idx_org_memberships_org     ON org_memberships(organization_id);
CREATE INDEX idx_org_memberships_role    ON org_memberships(organization_id, role);

-- RLS: users see only their own memberships
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_memberships_own_user"
    ON org_memberships FOR SELECT
    USING (user_id = auth.uid());

-- ─── 2. Backfill existing users → org_memberships ───────────

INSERT INTO org_memberships (user_id, organization_id, role)
SELECT id, organization_id, role
FROM users
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- ─── 3. Add max_sites column to plans ───────────────────────

ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS max_sites INTEGER NOT NULL DEFAULT 1
        CHECK (max_sites = 1 OR max_sites = -1);

-- ─── 4. Update org_subscriptions RLS to work with multi-org ─
-- The policy needs to check if the user is a member of the org,
-- not just if it matches their current active org.

DROP POLICY IF EXISTS "subscriptions_own_org" ON organization_subscriptions;

CREATE POLICY "subscriptions_own_org" ON organization_subscriptions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()
        )
    );

-- ─── 5. Same for credit_transactions ────────────────────────

DROP POLICY IF EXISTS "credit_transactions_own_org" ON credit_transactions;

CREATE POLICY "credit_transactions_own_org" ON credit_transactions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM org_memberships WHERE user_id = auth.uid()
        )
    );
