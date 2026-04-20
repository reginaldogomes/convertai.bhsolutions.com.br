-- 1. Tabela para agrupar páginas em um "Site"
CREATE TABLE sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz
);

-- Habilitar RLS e criar policies
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizações podem gerenciar seus próprios sites"
ON sites FOR ALL
USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Super admins podem gerenciar todos os sites"
ON sites FOR ALL
USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean, false));


-- 2. Modificar landing_pages para pertencer a um site
ALTER TABLE landing_pages
ADD COLUMN site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
ADD COLUMN is_homepage BOOLEAN NOT NULL DEFAULT false;

-- Adicionar um índice para buscas rápidas
CREATE INDEX idx_landing_pages_site_id ON landing_pages(site_id);


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
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizações podem gerenciar seus próprios domínios" ON public.custom_domains;
CREATE POLICY "Organizações podem gerenciar seus próprios domínios"
ON public.custom_domains FOR ALL USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

DROP POLICY IF EXISTS "Super admins podem gerenciar todos os domínios" ON public.custom_domains;
CREATE POLICY "Super admins podem gerenciar todos os domínios"
ON public.custom_domains FOR ALL USING (coalesce((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean, false));

-- 4. Modificar custom_domains para apontar para um site, não uma página
-- Primeiro, removemos a FK antiga se ela existir
ALTER TABLE custom_domains DROP COLUMN IF EXISTS target_page_id;

-- Adicionamos a nova referência ao site
ALTER TABLE custom_domains
ADD COLUMN site_id uuid REFERENCES sites(id) ON DELETE CASCADE;

CREATE INDEX idx_custom_domains_site_id ON custom_domains(site_id);