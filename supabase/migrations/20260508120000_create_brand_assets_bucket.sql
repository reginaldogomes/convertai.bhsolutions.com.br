-- Bucket público para assets de marca da organização (logos, ícones, imagens de seção).
-- Compartilhado entre sites, landing pages e qualquer outro módulo que precise de assets visuais.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'brand-assets',
    'brand-assets',
    true,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;
