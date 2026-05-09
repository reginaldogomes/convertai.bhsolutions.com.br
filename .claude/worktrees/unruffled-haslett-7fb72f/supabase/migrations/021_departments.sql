-- ============================================================
-- 021: Departments — org-scoped, multi-department per user
-- ============================================================

-- ─── 1. departments ─────────────────────────────────────────

CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    color           TEXT NOT NULL DEFAULT '#6366f1',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_departments_org ON departments(organization_id);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- members can read departments in their active org
CREATE POLICY "departments_read_own_org" ON departments
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

-- only owner/admin can insert
CREATE POLICY "departments_insert_own_org" ON departments
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
    );

-- only owner/admin can update
CREATE POLICY "departments_update_own_org" ON departments
    FOR UPDATE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
    );

-- only owner/admin can delete
CREATE POLICY "departments_delete_own_org" ON departments
    FOR DELETE USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
    );

-- ─── 2. user_departments (junction) ─────────────────────────

CREATE TABLE user_departments (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, department_id)
);

CREATE INDEX idx_user_departments_user   ON user_departments(user_id);
CREATE INDEX idx_user_departments_dept   ON user_departments(department_id);

ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- anyone in the org can read assignments (to show team structure)
CREATE POLICY "user_departments_read_own_org" ON user_departments
    FOR SELECT USING (
        department_id IN (
            SELECT id FROM departments
            WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
    );

-- only owner/admin can assign/unassign
CREATE POLICY "user_departments_write_own_org" ON user_departments
    FOR ALL USING (
        department_id IN (
            SELECT id FROM departments
            WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        )
        AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
    );
