-- MaestrIA · WhatsApp real (beta): número vinculado por QR a un agente, conversaciones y citas recogidas.
-- Todo lo escribe el servidor (Edge Functions wa-connect y wa-webhook). El alumno solo lee lo suyo.
--
-- Privacidad: wa_messages guarda conversaciones reales de clientes de los alumnos. El servidor borra los mensajes de más de
-- 30 días (ver wa-webhook) y todo se elimina en cascada si se desconecta el número, se borra el agente o el proyecto.

-- 1. El mapa pasa de 9 a 10 pasos (la restricción original solo admitía hasta el 9)
alter table public.roadmaps drop constraint roadmaps_current_section_check;
alter table public.roadmaps add constraint roadmaps_current_section_check check (current_section between 1 and 12);

-- 2. Número de WhatsApp vinculado a un agente (uno por agente)
create table public.whatsapp_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  roadmap_id    uuid not null references public.roadmaps (id) on delete cascade,
  agent_id      uuid not null references public.agents (id) on delete cascade,
  session       text not null unique,                 -- nombre de la sesión en el servidor de WhatsApp (no adivinable)
  status        text not null default 'starting' check (status in ('starting', 'scan_qr', 'working', 'failed', 'stopped')),
  phone         text,
  replies_day   date not null default current_date,
  replies_today integer not null default 0,           -- tope diario de respuestas (control de gasto y de riesgo)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index whatsapp_one_per_agent on public.whatsapp_connections (agent_id);
create index whatsapp_user_idx on public.whatsapp_connections (user_id);
create trigger whatsapp_connections_touch before update on public.whatsapp_connections
  for each row execute function public.touch_updated_at();

-- 3. Conversaciones (una por cliente del negocio) y sus mensajes
create table public.wa_conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  connection_id   uuid not null references public.whatsapp_connections (id) on delete cascade,
  chat_id         text not null,
  contact_name    text,
  paused_until    timestamptz,                        -- si el dueño contesta desde su móvil, el agente se calla un rato
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (connection_id, chat_id)
);
create index wa_conversations_recent_idx on public.wa_conversations (connection_id, last_message_at desc);

create table public.wa_messages (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  conversation_id uuid not null references public.wa_conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'owner')),
  content         text not null,
  wa_id           text,                               -- id del mensaje en WhatsApp: evita procesar dos veces un reenvío del webhook
  created_at      timestamptz not null default now()
);
create index wa_messages_conv_idx on public.wa_messages (conversation_id, id desc);
create unique index wa_messages_dedupe on public.wa_messages (conversation_id, wa_id) where wa_id is not null;

-- 4. Citas que el agente ha cerrado con un cliente
create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  connection_id   uuid not null references public.whatsapp_connections (id) on delete cascade,
  conversation_id uuid references public.wa_conversations (id) on delete set null,
  name            text,
  phone           text,
  service         text,
  when_text       text,
  notes           text,
  created_at      timestamptz not null default now()
);
create index bookings_connection_idx on public.bookings (connection_id, created_at desc);

-- 5. Permisos: el alumno solo lee lo suyo (y borra sus citas); escribe el servidor
alter table public.whatsapp_connections enable row level security;
alter table public.wa_conversations enable row level security;
alter table public.wa_messages enable row level security;
alter table public.bookings enable row level security;
create policy wa_connections_select_own on public.whatsapp_connections for select using (user_id = auth.uid());
create policy wa_conversations_select_own on public.wa_conversations for select using (user_id = auth.uid());
create policy wa_messages_select_own on public.wa_messages for select using (user_id = auth.uid());
create policy bookings_select_own on public.bookings for select using (user_id = auth.uid());
create policy bookings_delete_own on public.bookings for delete using (user_id = auth.uid());
revoke all on public.whatsapp_connections, public.wa_conversations, public.wa_messages, public.bookings from anon, authenticated;
grant select on public.whatsapp_connections, public.wa_conversations, public.wa_messages to authenticated;
grant select, delete on public.bookings to authenticated;
grant all on public.whatsapp_connections, public.wa_conversations, public.wa_messages, public.bookings to service_role;
grant all on all sequences in schema public to service_role;
