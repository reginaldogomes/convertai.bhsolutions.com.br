-- 1. Tabela para agrupar páginas em um "Site"
CREATE TABLE IF NOT EXISTS sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);

-- Habilitar RLS e criar policies
DO $$
BEGIN
    -- Habilitar RLS apenas se não estiver habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'sites' AND n.nspname = 'public'
        AND c.relrowsecurity = false
    ) THEN
        ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Criar policies apenas se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sites' AND policyname = 'Organizações podem gerenciar seus próprios sites'
    ) THEN
        CREATE POLICY "Organizações podem gerenciar seus próprios sites"
        ON sites FOR ALL
        USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'sites' AND policyname = 'Super admins podem gerenciar todos os sites'
    ) THEN
        CREATE POLICY "Super admins podem gerenciar todos os sites"
        ON sites FOR ALL
        USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean, false));
    END IF;
END $$;


-- 2. Modificar landing_pages para pertencer a um site
DO $$
BEGIN
    -- Adicionar coluna site_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'landing_pages' AND column_name = 'site_id'
    ) THEN
        ALTER TABLE landing_pages
        ADD COLUMN site_id uuid REFERENCES sites(id) ON DELETE SET NULL;
    END IF;

    -- Adicionar coluna is_homepage se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'landing_pages' AND column_name = 'is_homepage'
    ) THEN
        ALTER TABLE landing_pages
        ADD COLUMN is_homepage BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Adicionar um índice para buscas rápidas (IF NOT EXISTS não funciona com CREATE INDEX, mas é seguro tentar)
CREATE INDEX IF NOT EXISTS idx_landing_pages_site_id ON landing_pages(site_id);


-- 3. Criar a tabela custom_domains se ela não existir, para garantir a idempotência.
-- Esta tabela é necessária para a funcionalidade de sites com domínios personalizados.
CREATE TABLE IF NOT EXISTS public.custom_domains (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    domain text NOT NULL UNIQUE,
    status text NOT NULL DEFAULT 'pending'::text,
    target_page_id uuid REFERENCES public.landing_pages(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);

-- Habilitar RLS e (re)criar policies para custom_domains para garantir que estejam corretas.
DO $$
BEGIN
    -- Habilitar RLS apenas se não estiver habilitado
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'custom_domains' AND n.nspname = 'public'
        AND c.relrowsecurity = false
    ) THEN
        ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DROP POLICY IF EXISTS "Organizações podem gerenciar seus próprios domínios" ON public.custom_domains;
CREATE POLICY "Organizações podem gerenciar seus próprios domínios"
ON public.custom_domains FOR ALL USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "Super admins podem gerenciar todos os domínios" ON public.custom_domains;