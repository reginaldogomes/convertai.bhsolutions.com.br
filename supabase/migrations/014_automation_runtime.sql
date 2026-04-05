-- Automation runtime infrastructure
-- 1) execution audit trail
-- 2) async queue to continue workflows after wait steps

create table if not exists public.automation_execution_logs (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    automation_id uuid not null references public.automations(id) on delete cascade,
    trigger_event text not null,
    step_index integer not null,
    step_type text not null,
    status text not null check (status in ('success', 'error', 'queued', 'skipped')),
    contact_id uuid null references public.contacts(id) on delete set null,
    metadata_json jsonb not null default '{}'::jsonb,
    error_message text null,
    executed_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create index if not exists idx_automation_execution_logs_org_created
    on public.automation_execution_logs(organization_id, created_at desc);

create index if not exists idx_automation_execution_logs_automation_created
    on public.automation_execution_logs(automation_id, created_at desc);

create table if not exists public.automation_job_queue (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    automation_id uuid not null references public.automations(id) on delete cascade,
    trigger_event text not null,
    contact_id uuid null references public.contacts(id) on delete set null,
    source text null,
    message text null,
    metadata_json jsonb not null default '{}'::jsonb,
    steps_json jsonb not null,
    execute_after timestamptz not null,
    status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'failed')),
    attempts integer not null default 0,
    max_attempts integer not null default 5,
    last_error text null,
    locked_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_automation_job_queue_due
    on public.automation_job_queue(status, execute_after)
    where status = 'pending';

create index if not exists idx_automation_job_queue_org_status
    on public.automation_job_queue(organization_id, status, updated_at desc);

create or replace function public.touch_automation_job_queue_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_touch_automation_job_queue_updated_at on public.automation_job_queue;

create trigger trg_touch_automation_job_queue_updated_at
before update on public.automation_job_queue
for each row execute function public.touch_automation_job_queue_updated_at();

alter table public.automation_execution_logs enable row level security;
alter table public.automation_job_queue enable row level security;
