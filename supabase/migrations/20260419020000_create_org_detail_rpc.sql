-- Cria a função RPC para buscar os detalhes de uma organização em uma única chamada.
-- Esta função otimiza o carregamento da página de detalhes da organização no painel de super admin,
-- consolidando três consultas (organização, usuários, landing pages) em uma.

create or replace function public.get_organization_detail(target_org_id uuid)
returns table (
    org_details json,
    users_json json,
    pages_json json
)
language sql stable security definer as $$
    select
        (select row_to_json(o) from (
            select id, name, created_at from public.organizations where id = target_org_id
        ) o) as org_details,
        (select json_agg(u) from (
            select id, name, email, role, created_at from public.users where organization_id = target_org_id order by created_at desc
        ) u) as users_json,
        (select json_agg(lp) from (
            select id, name, slug, status, created_at from public.landing_pages where organization_id = target_org_id order by created_at desc
        ) lp) as pages_json;
$$;