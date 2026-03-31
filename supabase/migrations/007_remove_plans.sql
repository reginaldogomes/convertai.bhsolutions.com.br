-- ============================================================
-- 007: Remove SaaS plans, limits, and overrides
-- Product mode — no plan restrictions
-- ============================================================

-- 1. Drop the effective limits view (depends on both tables)
DROP VIEW IF EXISTS organization_effective_limits;

-- 2. Drop the overrides table
DROP TABLE IF EXISTS organization_plan_overrides;

-- 3. Drop the plans table
DROP TABLE IF EXISTS plans;

-- 4. Remove the plan column and its CHECK constraint from organizations
ALTER TABLE organizations DROP COLUMN IF EXISTS plan;
