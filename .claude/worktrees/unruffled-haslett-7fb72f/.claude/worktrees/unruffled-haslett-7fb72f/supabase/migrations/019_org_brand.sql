-- Adiciona coluna brand_json à tabela organizations para armazenar
-- o design system e identidade visual padrão da organização.
-- Este campo serve como fallback para todas as landing pages, sites,
-- campanhas e automações da org.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'brand_json'
    ) THEN
        ALTER TABLE organizations ADD COLUMN brand_json JSONB NOT NULL DEFAULT '{}';
    END IF;
END $$;
