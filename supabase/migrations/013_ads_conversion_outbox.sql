create table if not exists public.ads_conversion_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
  event_type text not null,
  session_id uuid null references public.chat_sessions(id) on delete set null,
  visitor_id text null,
  metadata_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  last_error text null,
  next_retry_at timestamptz not null default now(),
  locked_at timestamptz null,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ads_conversion_outbox_status_next_retry_idx
  on public.ads_conversion_outbox(status, next_retry_at);

create index if not exists ads_conversion_outbox_landing_page_idx
  on public.ads_conversion_outbox(landing_page_id);

alter table public.ads_conversion_outbox enable row level security;
