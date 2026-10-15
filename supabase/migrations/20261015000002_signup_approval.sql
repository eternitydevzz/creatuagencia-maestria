-- MaestrIA · registro abierto con aprobación manual.
-- ORDEN DE DESPLIEGUE: esta migración → Edge Functions → web → por último `supabase config push` (abre el registro). Si el
-- registro se abriera antes de esta migración, quien se registrara en ese rato recibiría créditos con el disparador antiguo.
-- Cualquiera puede crear su cuenta (y confirmar su email), pero entra "en revisión": sin créditos y sin poder crear proyectos,
-- cargar el ejemplo ni usar la IA, hasta que un administrador la aprueba desde la pestaña Alumnos. Al aprobarla se le dan los
-- créditos. Así abrir el registro no abre la clave de la IA a cualquiera que se dé de alta (ni a bots).
--   · approved_at null = en revisión. Las cuentas que ya existían quedan aprobadas.
--   · Las altas que hace un administrador (panel o scripts/invite.mjs) se aprueban en el mismo momento.
--   · El alumno no puede tocar estas columnas: solo puede editar su nombre (ver 20261002000002_hardening.sql).

alter table public.profiles
  add column approved_at timestamptz,
  add column approved_by uuid references public.profiles (id) on delete set null,
  add column phone       text check (phone is null or char_length(phone) <= 30);

update public.profiles set approved_at = created_at where approved_at is null;

-- El nombre lo puede editar el propio alumno (Ajustes) y ahora cualquiera puede registrarse: se acota también al editarlo.
alter table public.profiles add constraint profiles_full_name_len check (full_name is null or char_length(full_name) <= 80);

-- El alta automática del perfil ya NO da créditos: entra en revisión con 0. Los datos del formulario de registro (nombre y
-- WhatsApp) llegan en raw_user_meta_data, que escribe el propio usuario: se recortan y el teléfono se limpia a dígitos.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_name  text := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80), '');
  v_phone text := nullif(left(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9+]', '', 'g'), 20), '');
begin
  insert into public.profiles (id, email, full_name, phone, credits)
  values (new.id, new.email, coalesce(v_name, split_part(new.email, '@', 1)), v_phone, 0);
  return new;
end $$;
-- Es la función del disparador de auth.users: nadie tiene que poder llamarla por la API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

/** Aprueba una cuenta y le da sus créditos de alta (los de app_settings si no se indican). Solo el servidor la llama.
 *  Si ya estaba aprobada no hace nada y devuelve false: aprobar dos veces no regala créditos dos veces. */
create function public.approve_student(p_user uuid, p_credits int default null, p_by uuid default null)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_credits int := coalesce(p_credits, (select (value)::int from public.app_settings where key = 'initial_credits'), 0);
begin
  if v_credits < 0 or v_credits > 1000 then raise exception 'invalid_credits' using errcode = '22023'; end if;
  update public.profiles set approved_at = now(), approved_by = p_by where id = p_user and approved_at is null;
  if not found then return false; end if;
  if v_credits > 0 then perform public.refund_credits(p_user, v_credits, 'alta: créditos iniciales'); end if;
  return true;
end $$;
revoke execute on function public.approve_student(uuid, int, uuid) from public, anon, authenticated;
grant execute on function public.approve_student(uuid, int, uuid) to service_role;

/** ¿La cuenta que hace la petición está aprobada? La usan las políticas de seguridad por filas. Un administrador cuenta
 *  siempre como aprobado (si alguien se registró y después lo hicieron admin, no se queda bloqueado). */
create function public.is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and (approved_at is not null or role = 'admin'))
$$;
revoke execute on function public.is_approved() from public, anon;
grant execute on function public.is_approved() to authenticated, service_role;

/** Para el panel de alumnos: si cada cuenta confirmó su email y cuándo entró por última vez. Lee auth.users directamente
 *  (la API de administración de usuarios va por páginas de 1000 y con el registro abierto se quedaría corta). Solo el servidor. */
create function public.admin_auth_info()
returns table (id uuid, email_confirmed_at timestamptz, last_sign_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select u.id, u.email_confirmed_at, u.last_sign_in_at from auth.users u
$$;
revoke execute on function public.admin_auth_info() from public, anon, authenticated;
grant execute on function public.admin_auth_info() to service_role;

-- Una cuenta en revisión no puede crear proyectos (el resto de lo que se puede hacer cuelga de un proyecto o lo hace el
-- servidor, que también comprueba la aprobación).
drop policy roadmaps_insert_own on public.roadmaps;
create policy roadmaps_insert_own on public.roadmaps for insert to authenticated
  with check (user_id = auth.uid() and public.is_approved());
