-- MaestrIA · sección "Tu agencia lista": oferta + cliente ideal, web de la agencia, kit de ventas y plan de 14 días.
alter table public.roadmaps
  add column agency_contact jsonb not null default '{}'::jsonb,   -- { whatsapp, email } del alumno (CTAs de su web)
  add column agency_offer   jsonb not null default '{}'::jsonb,   -- { cliente_ideal, oferta }
  add column agency_site    jsonb not null default '{}'::jsonb,   -- textos de la web (se monta sobre una plantilla fija)
  add column sales_kit      jsonb not null default '{}'::jsonb,   -- { dm, email, cold_call, closing }
  add column action_plan    jsonb not null default '{}'::jsonb;   -- plan de 14 días

alter table public.roadmaps drop constraint roadmaps_current_section_check;
alter table public.roadmaps add constraint roadmaps_current_section_check check (current_section between 1 and 10);

-- La sección "Tu agencia lista" completa cuesta 17 créditos (oferta 3 + web 3 + kit de ventas 4x2 + plan 3):
-- subimos los créditos iniciales para que un alumno pueda terminar todo el mapa de ruta sin quedarse corto.
update public.app_settings set value = '60'::jsonb where key = 'initial_credits';
