-- MaestrIA · el producto se centra en tres entregables: cliente ideal, oferta y landing.
-- Se elimina todo lo demás (análisis de nicho, ofertas/propuesta antiguas, prompt de landing para Lovable,
-- scripts de llamada, demos de agentes, presentación, kit de ventas, plan de 14 días y notas).

-- 1. El cliente ideal pasa a ser un entregable propio (antes vivía dentro de agency_offer).
alter table public.roadmaps add column ideal_client jsonb not null default '{}'::jsonb;
update public.roadmaps
   set ideal_client = agency_offer -> 'cliente_ideal',
       agency_offer = agency_offer - 'cliente_ideal'
 where agency_offer ? 'cliente_ideal';

-- 2. Columnas de funciones que ya no existen.
alter table public.roadmaps
  drop column generated_propuesta,
  drop column generated_offers,
  drop column generated_scripts,
  drop column generated_landing_prompts,
  drop column generated_gamma_prompt,
  drop column demo_prompts,
  drop column niche_analysis,
  drop column sales_kit,
  drop column action_plan,
  drop column notes,
  drop column next_steps;

-- 3. El mapa pasa a tener 6 pasos.
update public.roadmaps set current_section = least(current_section, 6);
update public.roadmaps set visited_sections = array(select s from unnest(visited_sections) s where s between 1 and 6);

-- 4. El mapa completo cuesta unos 10 créditos (cliente ideal 2 + oferta 3 + landing 3 + sugerencias):
--    30 créditos dan para completarlo y regenerar cada entregable varias veces.
update public.app_settings set value = '30'::jsonb where key = 'initial_credits';
