-- Garante que o bucket para ativos da base de conhecimento exista.
-- Este bucket é público para permitir o acesso direto às imagens via URL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('knowledge-base-assets', 'knowledge-base-assets', true, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;