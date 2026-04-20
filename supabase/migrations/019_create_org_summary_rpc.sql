-- Cria a função RPC para buscar um resumo de todas as organizações.
-- Esta função é usada na página de super admin para listar as organizações
-- com contagens de usuários e landing pages.

create or replace function public.get_all_organizations_summary()
returns table (
    id uuid,
    name text,
    created_at timestamptz,
    user_count bigint,
    landing_page_count bigint
)
language sql stable security definer as $$
    select
        o.id,
        o.name,
        o.created_at,
        (select count(*) from public.users u where u.organization_id = o.id) as user_count,
        (select count(*) from public.landing_pages lp where lp.organization_id = o.id) as landing_page_count
    from public.organizations as o
    where o.id <> '00000000-0000-0000-0000-000000000001' -- Exclui a organização da plataforma
    order by o.created_at desc;
$$;