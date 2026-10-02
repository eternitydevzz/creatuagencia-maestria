-- MaestrIA · esquema inicial
-- Modelo: alumnos invitados (auth.users) -> perfil con créditos -> proyectos (roadmaps) -> generaciones con IA.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- ajustes
create table public.app_settings (
  key   text primary key,
  value jsonb not null
);
insert into public.app_settings (key, value) values
  ('initial_credits', '30'::jsonb);   -- créditos que recibe un alumno al ser dado de alta

-- ---------------------------------------------------------------- perfiles
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text not null,
  full_name         text,
  organization_name text,
  role              text not null default 'student' check (role in ('student', 'admin')),
  credits           integer not null default 0 check (credits >= 0),
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------- libro de créditos
create table public.credit_ledger (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  delta         integer not null,
  reason        text not null,
  generation_id uuid,
  balance_after integer not null,
  created_at    timestamptz not null default now()
);
create index credit_ledger_user_idx on public.credit_ledger (user_id, created_at desc);

-- ---------------------------------------------------------------- proyectos (Mapa de Ruta)
create table public.roadmaps (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references public.profiles (id) on delete cascade,
  project_name                text not null check (char_length(project_name) between 1 and 120),
  agency_name                 text,
  status                      text not null default 'draft' check (status in ('draft', 'in_progress', 'completed')),
  selected_problems           jsonb not null default '[]'::jsonb,
  custom_problem_descriptions jsonb not null default '{}'::jsonb,
  selected_nichos             jsonb not null default '[]'::jsonb,
  business_metrics            jsonb not null default '{}'::jsonb,
  pricing_settings            jsonb not null default '{}'::jsonb,
  generated_report            text,
  generated_propuesta         text,
  generated_offers            jsonb not null default '[]'::jsonb,
  generated_scripts           jsonb not null default '[]'::jsonb,
  generated_landing_prompts   jsonb not null default '[]'::jsonb,
  generated_setter_prompt     text,
  generated_gamma_prompt      text,
  demo_prompts                jsonb not null default '[]'::jsonb,
  niche_analysis              jsonb not null default '{}'::jsonb,
  notes                       text,
  next_steps                  text,
  current_section             integer not null default 1 check (current_section between 1 and 9),
  visited_sections            integer[] not null default '{1}',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index roadmaps_user_idx on public.roadmaps (user_id, updated_at desc);

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger roadmaps_touch before update on public.roadmaps
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- generaciones con IA (auditoría y coste)
create table public.generations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  roadmap_id    uuid references public.roadmaps (id) on delete set null,
  kind          text not null,
  status        text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  credits_cost  integer not null default 0,
  model         text,
  input_tokens  integer,
  output_tokens integer,
  error         text,
  request_id    text,
  created_at    timestamptz not null default now(),
  finished_at   timestamptz
);
create index generations_user_idx on public.generations (user_id, created_at desc);

-- ---------------------------------------------------------------- alta automática de perfil
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  initial int := coalesce((select (value)::int from public.app_settings where key = 'initial_credits'), 0);
begin
  insert into public.profiles (id, email, full_name, credits)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), initial);
  if initial > 0 then
    insert into public.credit_ledger (user_id, delta, reason, balance_after)
    values (new.id, initial, 'alta: créditos iniciales', initial);
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- créditos: solo el servidor los mueve
create function public.spend_credits(p_user uuid, p_cost int, p_reason text, p_generation uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare balance int;
begin
  if p_cost < 0 then raise exception 'invalid_cost'; end if;
  update public.profiles set credits = credits - p_cost
   where id = p_user and credits >= p_cost
  returning credits into balance;
  if balance is null then raise exception 'insufficient_credits'; end if;
  insert into public.credit_ledger (user_id, delta, reason, generation_id, balance_after)
  values (p_user, -p_cost, p_reason, p_generation, balance);
  return balance;
end $$;

create function public.refund_credits(p_user uuid, p_amount int, p_reason text, p_generation uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare balance int;
begin
  update public.profiles set credits = credits + p_amount where id = p_user returning credits into balance;
  if balance is null then raise exception 'user_not_found'; end if;
  insert into public.credit_ledger (user_id, delta, reason, generation_id, balance_after)
  values (p_user, p_amount, p_reason, p_generation, balance);
  return balance;
end $$;

-- solo service_role puede ejecutarlas (la Edge Function y el script de invitaciones)
revoke all on function public.spend_credits(uuid, int, text, uuid)  from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, int, text, uuid) from public, anon, authenticated;
grant execute on function public.spend_credits(uuid, int, text, uuid)  to service_role;
grant execute on function public.refund_credits(uuid, int, text, uuid) to service_role;

-- ---------------------------------------------------------------- seguridad por filas
alter table public.app_settings  enable row level security;   -- sin políticas: solo service_role
alter table public.profiles      enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.roadmaps      enable row level security;
alter table public.generations   enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- el alumno solo puede editar su nombre y organización; créditos y rol quedan fuera de su alcance
revoke update on public.profiles from authenticated;
grant  update (full_name, organization_name) on public.profiles to authenticated;

create policy ledger_select_own      on public.credit_ledger for select to authenticated using (user_id = auth.uid());
create policy generations_select_own on public.generations   for select to authenticated using (user_id = auth.uid());

create policy roadmaps_select_own on public.roadmaps for select to authenticated using (user_id = auth.uid());
create policy roadmaps_insert_own on public.roadmaps for insert to authenticated with check (user_id = auth.uid());
create policy roadmaps_update_own on public.roadmaps for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy roadmaps_delete_own on public.roadmaps for delete to authenticated using (user_id = auth.uid());

grant select, insert, update, delete on public.roadmaps to authenticated;
grant select on public.profiles, public.credit_ledger, public.generations to authenticated;
