-- MaestrIA · agentes de atención (la "secretaria" que el alumno enseña a sus clientes).
-- Un agente es la ficha de un negocio (servicios, precios, horario…) más el tono de la secretaria. Las instrucciones del chat se
-- construyen en el servidor a partir de esa ficha (supabase/functions/_shared/agent.ts), así que aquí solo se guarda la ficha.
--   source = 'niche' → el agente de ejemplo del nicho del alumno (uno por proyecto)
--   source = 'demo'  → demos para negocios reales de sus prospectos (varios por proyecto)

create table public.agents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  roadmap_id    uuid not null references public.roadmaps (id) on delete cascade,
  source        text not null check (source in ('niche', 'demo')),
  business_name text not null,
  config        jsonb not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index agents_one_niche on public.agents (roadmap_id) where source = 'niche';
create index agents_roadmap_idx on public.agents (roadmap_id, created_at desc);
create trigger agents_touch before update on public.agents
  for each row execute function public.touch_updated_at();

-- El alumno solo lee y borra los suyos; los crea y modifica el servidor (la ficha la escribe la IA con la huella de sus respuestas).
alter table public.agents enable row level security;
create policy agents_select_own on public.agents for select using (user_id = auth.uid());
create policy agents_delete_own on public.agents for delete using (user_id = auth.uid());
revoke all on public.agents from anon, authenticated;
grant select, delete on public.agents to authenticated;

-- Registro de mensajes del simulador, solo para limitar el ritmo (sin contenido). Únicamente el servidor lo toca.
create table public.agent_chat_log (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index agent_chat_log_idx on public.agent_chat_log (user_id, created_at desc);
alter table public.agent_chat_log enable row level security;
revoke all on public.agent_chat_log from anon, authenticated;

grant all on public.agents, public.agent_chat_log to service_role;
grant all on all sequences in schema public to service_role;
