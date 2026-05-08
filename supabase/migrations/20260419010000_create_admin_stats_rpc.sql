-- Cria a função RPC para buscar as estatísticas globais da plataforma.
-- Esta função consolida múltiplas consultas em uma única chamada para
-- melhorar a performance do dashboard de super admin.

create or replace function public.get_admin_stats()
returns table (
    total_orgs bigint,
    total_users bigint,
    total_landing_pages bigint,
    mrr_brl numeric,
    active_subscriptions bigint,
    total_credits_balance numeric
)
language sql stable security definer as $$
    select
        (select count(*) from public.organizations where id <> '00000000-0000-0000-0000-000000000001') as total_orgs,
        (select count(*) from public.users where organization_id <> '00000000-0000-0000-0000-000000000001') as total_users,
        (select count(*) from public.landing_pages) as total_landing_pages,
        (select coalesce(sum(p.price_brl), 0) from public.organization_subscriptions s join public.plans p on s.plan_id = p.id where s.status = 'active' and s.organization_id <> '00000000-0000-0000-0000-000000000001') as mrr_brl,
        (select count(*) from public.organization_subscriptions s where s.status = 'active' and s.organization_id <> '00000000-0000-0000-0000-000000000001') as active_subscriptions,
        (select coalesce(sum(credits_balance), 0) from public.organizations where id <> '00000000-0000-0000-0000-000000000001') as total_credits_balance;
$$;