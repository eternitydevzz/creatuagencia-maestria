-- MaestrIA · link público de una demo para clientes.
-- El alumno comparte un link (…/d/<código>) y su prospecto habla con "su" secretaria desde el móvil, sin cuenta.
--   · El código es aleatorio (128 bits) y vence a los 7 días; el alumno puede renovarlo o desactivarlo.
--   · Solo las demos (source = 'demo') se comparten: el agente de ejemplo del nicho no.
--   · Lo público es mínimo: nombre del negocio, de la secretaria y de la agencia (si el alumno la nombró). La ficha completa y las instrucciones nunca salen.
--   · El chat público pasa por la Edge Function `agent-chat`, con topes propios por link (ver allí).

alter table public.agents
  add column share_token      text unique,
  add column share_expires_at timestamptz;

-- El registro de mensajes del chat (solo fechas, para limitar el ritmo) apunta al agente cuando el mensaje llega por un link
-- público: así se limita cada link por separado, además del total del alumno. Si se borra la demo, sus mensajes siguen contando
-- para el total por hora del alumno (set null), para que borrar y volver a crear no reinicie el límite.
alter table public.agent_chat_log add column agent_id uuid references public.agents (id) on delete set null;
create index agent_chat_log_agent_idx on public.agent_chat_log (agent_id, created_at desc) where agent_id is not null;

/** Crea (o renueva) el link de una demo propia. Devuelve el código y su vencimiento. */
create function public.share_demo(p_agent uuid)
returns table (token text, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_token text := translate(encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'), '+/=', '-_');
begin
  return query
    update public.agents a
       set share_token = v_token, share_expires_at = now() + interval '7 days'
     where a.id = p_agent and a.user_id = auth.uid() and a.source = 'demo'
    returning a.share_token, a.share_expires_at;
  if not found then raise exception 'agent_not_found' using errcode = 'P0002'; end if;
end $$;

/** Desactiva el link de una demo propia (el código deja de funcionar al momento). */
create function public.unshare_demo(p_agent uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.agents set share_token = null, share_expires_at = null
   where id = p_agent and user_id = auth.uid() and source = 'demo';
  if not found then raise exception 'agent_not_found' using errcode = 'P0002'; end if;
end $$;

/** Lo que ve cualquiera con el link: solo lo necesario para pintar el chat. Nada si el código no existe o venció. */
create function public.public_demo(p_token text)
returns table (business_name text, secretary_name text, agency_name text, first_service text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.business_name,
         a.config #>> '{secretaria,nombre}',
         nullif(r.agency_name, ''), -- nunca el nombre interno del proyecto
         a.config #>> '{servicios,0,nombre}',
         a.share_expires_at
    from public.agents a
    join public.roadmaps r on r.id = a.roadmap_id
   where p_token is not null and length(p_token) between 16 and 64
     and a.share_token = p_token and a.source = 'demo' and a.share_expires_at > now()
$$;

revoke execute on function public.share_demo(uuid), public.unshare_demo(uuid), public.public_demo(text) from public, anon, authenticated;
grant execute on function public.share_demo(uuid), public.unshare_demo(uuid) to authenticated;
grant execute on function public.public_demo(text) to anon, authenticated;
grant execute on function public.share_demo(uuid), public.unshare_demo(uuid), public.public_demo(text) to service_role;
