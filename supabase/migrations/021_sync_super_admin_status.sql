-- Adiciona uma coluna 'is_super_admin' na tabela pública de usuários
-- e cria um gatilho para mantê-la sincronizada com os metadados do 'auth.users'.
-- Isso otimiza drasticamente a consulta de super admins, evitando a necessidade
-- de listar todos os usuários da plataforma.

-- 1. Adiciona a coluna na tabela de usuários públicos
alter table public.users
add column if not exists is_super_admin boolean not null default false;

create index if not exists users_is_super_admin_idx on public.users (is_super_admin) where is_super_admin = true;

-- 2. Cria a função que será chamada pelo trigger
create or replace function public.sync_user_super_admin_status()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.users
  set is_super_admin = coalesce((new.raw_app_meta_data ->> 'is_super_admin')::boolean, false)
  where id = new.id;
  return new;
end;
$$;

-- 3. Cria o trigger na tabela auth.users para ser acionado em updates
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.sync_user_super_admin_status();