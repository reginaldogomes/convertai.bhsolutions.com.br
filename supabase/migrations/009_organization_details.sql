-- 009: Add organization detail fields
-- Allows storing company info for use across the project

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email       TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone       TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website     TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address     TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city        TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state       TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS zip_code    TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country     TEXT DEFAULT 'BR';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url    TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;
