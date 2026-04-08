-- AI governance baseline: quotas + usage audit trail

create table if not exists public.ai_quota_policies (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null unique references public.organizations(id) on delete cascade,
    daily_requests_limit integer not null default 120,
    monthly_budget_cents integer not null default 3000,
    hard_block_enabled boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (daily_requests_limit >= 1),
    check (monthly_budget_cents >= 100)
);

create table if not exists public.ai_usage_events (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid null references public.users(id) on delete set null,
    request_id text not null,
    route_scope text not null,
    feature_key text not null,
    provider text not null,
    model text not null,
    status text not null check (status in ('started', 'success', 'error', 'blocked')),
    input_chars integer not null default 0,
    output_chars integer not null default 0,
    estimated_cost_cents numeric(10, 4) not null default 0,
    duration_ms integer null,
    error_code text null,
    metadata_json jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    check (input_chars >= 0),
    check (output_chars >= 0),
    check (estimated_cost_cents >= 0)
);

create index if not exists idx_ai_usage_events_org_created
    on public.ai_usage_events(organization_id, created_at desc);

create index if not exists idx_ai_usage_events_org_status_created
    on public.ai_usage_events(organization_id, status, created_at desc);

create index if not exists idx_ai_usage_events_request_id
    on public.ai_usage_events(request_id);

create unique index if not exists idx_ai_usage_events_dedupe
    on public.ai_usage_events(organization_id, request_id, route_scope, status);

create index if not exists idx_ai_usage_events_feature_created
    on public.ai_usage_events(feature_key, created_at desc);

create or replace function public.touch_ai_quota_policies_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_touch_ai_quota_policies_updated_at on public.ai_quota_policies;

create trigger trg_touch_ai_quota_policies_updated_at
before update on public.ai_quota_policies
for each row execute function public.touch_ai_quota_policies_updated_at();

create or replace function public.purge_old_ai_usage_events(target_organization_id uuid, retention_days integer default 90)
returns integer
language plpgsql
as $$
declare
    deleted_count integer;
    safe_retention_days integer;
begin
    if target_organization_id is null then
        return 0;
    end if;

    safe_retention_days := least(greatest(coalesce(retention_days, 90), 1), 3650);

    delete from public.ai_usage_events
    where organization_id = target_organization_id
      and created_at < (now() - make_interval(days => safe_retention_days));

    get diagnostics deleted_count = row_count;
    return deleted_count;
end;
$$;

alter table public.ai_quota_policies enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists "Users can view own org ai quota policy" on public.ai_quota_policies;
drop policy if exists "Users can manage own org ai quota policy" on public.ai_quota_policies;
drop policy if exists "Users can view own org ai usage events" on public.ai_usage_events;
drop policy if exists "Users can manage own org ai usage events" on public.ai_usage_events;

create policy "Users can view own org ai quota policy"
    on public.ai_quota_policies for select
    using (
        organization_id in (
            select organization_id from public.users where id = auth.uid()
        )
    );

create policy "Users can manage own org ai quota policy"
    on public.ai_quota_policies for all
    using (
        organization_id in (
            select organization_id from public.users where id = auth.uid()
        )
    )
    with check (
        organization_id in (
            select organization_id from public.users where id = auth.uid()
        )
    );

create policy "Users can view own org ai usage events"
    on public.ai_usage_events for select
    using (
        organization_id in (
            select organization_id from public.users where id = auth.uid()
        )
    );

create policy "Users can manage own org ai usage events"
    on public.ai_usage_events for all
    using (
        organization_id in (
            select organization_id from public.users where id = auth.uid()
        )
    )
    with check (
        organization_id in (
            select organization_id from public.users where id = auth.uid()
        )
    );
