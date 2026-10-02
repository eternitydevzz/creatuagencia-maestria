-- MaestrIA · permisos explícitos para el rol del servidor (service_role).
-- En local, Supabase los concede solos sobre las tablas nuevas; en la nube NO, porque las migraciones las crea la CLI con un
-- usuario temporal y los permisos por defecto no se aplican. Sin esto, la Edge Function falla con "permission denied".
-- Es el único rol que escribe en generations, credit_ledger y app_settings; el alumno (authenticated) conserva solo lo que se
-- le concedió en las migraciones anteriores.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- Las funciones de cobro y de limpieza solo las puede ejecutar el servidor (el grant anterior no debe abrirlas a nadie más)
revoke execute on function public.spend_credits(uuid, int, text, uuid), public.refund_credits(uuid, int, text, uuid),
  public.sweep_stale_generations(uuid) from public, anon, authenticated;
