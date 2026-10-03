-- MaestrIA · latido para que el plan gratuito de Supabase no pause el proyecto por falta de actividad.
-- Lo llama un cron de GitHub Actions cada dos días (.github/workflows/keepalive.yml). No devuelve ningún dato.
create function public.ping() returns timestamptz language sql stable as $$ select now() $$;
grant execute on function public.ping() to anon, authenticated;
