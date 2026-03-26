-- Script para corrigir usuários que existem no auth.users mas NÃO no public.users
-- Isso acontece quando o registro falhou por causa de RLS/permissões
-- Execute no Supabase SQL Editor APÓS rodar 002_fix_rls_policies.sql

-- ============================================================
-- 1. Criar organizações e perfis para TODOS os auth.users sem perfil
-- ============================================================
DO $$
DECLARE
    auth_user RECORD;
    new_org_id UUID;
BEGIN
    FOR auth_user IN
        SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) AS name
        FROM auth.users au
        LEFT JOIN public.users pu ON pu.id = au.id
        WHERE pu.id IS NULL
    LOOP
        -- Criar organização para o usuário órfão
        INSERT INTO public.organizations (name)
        VALUES (auth_user.name || ' Org')
        RETURNING id INTO new_org_id;

        -- Criar perfil do usuário vinculado à organização
        INSERT INTO public.users (id, organization_id, name, email, role)
        VALUES (auth_user.id, new_org_id, auth_user.name, auth_user.email, 'owner');

        RAISE NOTICE 'Usuário corrigido: % (%)', auth_user.email, auth_user.id;
    END LOOP;
END $$;

-- ============================================================
-- 2. Verificação: listar todos os usuários e seus status
-- ============================================================
SELECT
    au.id,
    au.email,
    au.created_at AS auth_created,
    pu.name AS profile_name,
    pu.role,
    o.name AS org_name,
    CASE WHEN pu.id IS NOT NULL THEN '✅ OK' ELSE '❌ SEM PERFIL' END AS status
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
LEFT JOIN public.organizations o ON o.id = pu.organization_id
ORDER BY au.created_at DESC;
