-- ============================================================
-- 005: Super Admin & Performance Indexes
-- Run AFTER 004_landing_pages_and_chat.sql
-- ============================================================

-- ============================================================
-- 1. PLATFORM ADMIN ORGANIZATION
-- Fixed UUID so it can be referenced in INSERT statements below.
-- ============================================================
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Platform Admin')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. COMPOSITE INDEXES
-- Replaces single-column indexes with compound indexes that
-- match the most common query patterns (org + filter column).
-- ============================================================
CREATE INDEX IF NOT EXISTS contacts_org_created_idx
    ON contacts(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS deals_org_stage_idx
    ON deals(organization_id, pipeline_stage);

CREATE INDEX IF NOT EXISTS campaigns_org_status_idx
    ON campaigns(organization_id, status);

CREATE INDEX IF NOT EXISTS landing_pages_org_status_idx
    ON landing_pages(organization_id, status);

CREATE INDEX IF NOT EXISTS messages_org_created_idx
    ON messages(organization_id, created_at DESC);

-- ============================================================
-- 3. JWT ENRICHMENT HOOK
-- Embeds org_id + role into app_metadata on every token issuance.
-- This eliminates the costly subquery per row in RLS evaluations.
--
-- ACTIVATION (one time, in Supabase Dashboard):
--   Authentication > Hooks > Custom Access Token
--   → Select function: public.custom_access_token_hook
-- ============================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    claims      jsonb;
    v_org_id    uuid;
    v_role      text;
BEGIN
    claims := event -> 'claims';

    SELECT u.organization_id, u.role
    INTO v_org_id, v_role
    FROM public.users u
    WHERE u.id = (event ->> 'user_id')::uuid;

    -- Merge org_id + role into app_metadata.
    -- is_super_admin is preserved because it is set via raw_app_meta_data
    -- (service role only) and is already present in claims -> app_metadata.
    claims := jsonb_set(
        claims,
        '{app_metadata}',
        COALESCE(claims -> 'app_metadata', '{}'::jsonb) ||
        jsonb_build_object(
            'org_id', v_org_id,
            'role',   COALESCE(v_role, 'agent')
        )
    );

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC, anon, authenticated;

-- ============================================================
-- HOW TO CREATE THE SUPER ADMIN USER (run once):
--
-- Step 1: DONE — user created in Supabase Dashboard
--         Email: contato@bhsolutions.com.br
--         UUID:  4ef403e4-8261-46a6-ae6c-d3203c8ec73d
--
-- Step 2: Run the script below in SQL Editor:
-- ============================================================

-- ---- PASTE AND RUN IN SUPABASE SQL EDITOR ----

-- 1. Mark as super admin (only service role can write raw_app_meta_data)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'
WHERE id = '4ef403e4-8261-46a6-ae6c-d3203c8ec73d';

-- 2. Create public profile linked to Platform Admin org
INSERT INTO public.users (id, organization_id, name, email, role)
VALUES (
  '4ef403e4-8261-46a6-ae6c-d3203c8ec73d',
  '00000000-0000-0000-0000-000000000001',
  'Reginaldo',
  'contato@bhsolutions.com.br',
  'owner'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verify
SELECT
  au.id,
  au.email,
  au.raw_app_meta_data -> 'is_super_admin' AS is_super_admin,
  pu.role,
  o.name AS org_name
FROM auth.users au
JOIN public.users pu ON pu.id = au.id
JOIN public.organizations o ON o.id = pu.organization_id
WHERE au.id = '4ef403e4-8261-46a6-ae6c-d3203c8ec73d';

-- Expected result:
--   is_super_admin = true
--   org_name       = Platform Admin

-- ---- END ----

-- Step 3: Log in at /login with contato@bhsolutions.com.br
--         The "Super Admin" link will appear in the sidebar footer.
--         Direct access: /admin
