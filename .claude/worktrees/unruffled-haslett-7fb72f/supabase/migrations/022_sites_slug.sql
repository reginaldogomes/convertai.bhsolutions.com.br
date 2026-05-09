-- Add slug to sites for clean public URLs (/s/[slug])
ALTER TABLE sites ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill slug from existing site names
UPDATE sites
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Ensure uniqueness and non-null going forward
ALTER TABLE sites ADD CONSTRAINT sites_slug_unique UNIQUE (slug);
ALTER TABLE sites ALTER COLUMN slug SET NOT NULL;
