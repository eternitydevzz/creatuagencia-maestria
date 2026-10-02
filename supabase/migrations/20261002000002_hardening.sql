-- MaestrIA · endurecimiento: no cobrar dos veces lo mismo, recuperar generaciones colgadas y proteger lo que escribe la IA.

-- 1. Solo puede haber una generación en curso por proyecto y tipo: un segundo clic (o una segunda pestaña) mientras Claude trabaja
--    ya no vuelve a generar ni a cobrar.
create unique index generations_one_running on public.generations (roadmap_id, kind) where status = 'running';

-- 2. Si la función murió a medias (tiempo máximo de ejecución), la generación se quedaría "en curso" para siempre y bloquearía
--    ese tipo. Al empezar una generación nueva se liberan las que llevan más de 6 minutos y se devuelven los créditos cobrados.
create function public.sweep_stale_generations(p_user uuid) returns int
language plpgsql security definer set search_path = public as $$
declare g record; n int := 0;
begin
  for g in select id, credits_cost from public.generations
            where user_id = p_user and status = 'running' and created_at < now() - interval '6 minutes'
            for update skip locked
  loop
    update public.generations set status = 'failed', error = 'timeout: la generación no terminó', finished_at = now() where id = g.id;
    -- solo se devuelve si se llegó a cobrar y todavía no se había devuelto
    if g.credits_cost > 0
       and exists (select 1 from public.credit_ledger where generation_id = g.id and delta < 0)
       and not exists (select 1 from public.credit_ledger where generation_id = g.id and delta > 0) then
      perform public.refund_credits(p_user, g.credits_cost, 'reembolso: timeout', g.id);
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.sweep_stale_generations(uuid) from public, anon, authenticated;
grant execute on function public.sweep_stale_generations(uuid) to service_role;

-- 3. El alumno solo puede escribir las respuestas del mapa. Lo que genera la IA (cliente ideal, oferta, landing) lo escribe
--    únicamente el servidor: así nadie puede darse por hecho un entregable ni falsear su huella.
revoke insert, update on public.roadmaps from authenticated;
grant insert (user_id, project_name, status, agency_name, selected_problems, custom_problem_descriptions, selected_nichos,
              business_metrics, pricing_settings, agency_contact, current_section, visited_sections)
  on public.roadmaps to authenticated;
grant update (project_name, status, agency_name, selected_problems, custom_problem_descriptions, selected_nichos,
              business_metrics, pricing_settings, agency_contact, current_section, visited_sections)
  on public.roadmaps to authenticated;

-- 4. Menos columnas que mantener: el nombre de la organización duplicaba el nombre de la agencia (paso 2 del mapa).
alter table public.profiles drop column organization_name;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
