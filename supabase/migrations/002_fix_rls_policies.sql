-- Fix RLS policies: add INSERT/UPDATE/DELETE rules for all tables
-- Run this in the Supabase SQL Editor

-- ============================================================
-- ORGANIZATIONS — allow members to SELECT their own org
-- ============================================================
CREATE POLICY "orgs_select_own" ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- USERS — allow INSERT for own profile, SELECT/UPDATE for same org
-- ============================================================
CREATE POLICY "users_insert_own" ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- CONTACTS — allow full CRUD for own org
-- ============================================================
CREATE POLICY "contacts_insert_own_org" ON contacts FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "contacts_update_own_org" ON contacts FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "contacts_delete_own_org" ON contacts FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- DEALS — allow full CRUD for own org
-- ============================================================
CREATE POLICY "deals_insert_own_org" ON deals FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "deals_update_own_org" ON deals FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "deals_delete_own_org" ON deals FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- MESSAGES — allow full CRUD for own org
-- ============================================================
CREATE POLICY "messages_insert_own_org" ON messages FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "messages_update_own_org" ON messages FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "messages_delete_own_org" ON messages FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- ============================================================
-- CAMPAIGNS — allow full CRUD for own org
-- ============================================================
CREATE POLICY "campaigns_insert_own_org" ON campaigns FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "campaigns_update_own_org" ON campaigns FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "campaigns_delete_own_org" ON campaigns FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));
