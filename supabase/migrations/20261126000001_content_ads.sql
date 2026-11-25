-- MaestrIA · contenido y anuncios: dos entregables nuevos que escribe la IA (función `generate`).
--   agency_content: { reels[5], bio, carruseles[3], _meta }   (paso "Tu contenido")
--   agency_ads:     { anuncios[3], videos[2], publico, _meta } (paso "Tus anuncios")
-- Solo los escribe el servidor: el alumno tiene permiso de escritura únicamente en las columnas que enumera
-- 20261002000002_hardening.sql, así que estas dos quedan fuera sin tener que revocar nada.
alter table public.roadmaps
  add column agency_content jsonb not null default '{}'::jsonb,
  add column agency_ads     jsonb not null default '{}'::jsonb;
