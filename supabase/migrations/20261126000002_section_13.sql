-- Paso 13 "Tus anuncios": el paso actual de un proyecto puede ser 13 (antes el límite era 12 y la web no podía guardar).
-- Hay que subir este límite cada vez que se añada un paso con un id nuevo en src/lib/gamification.ts (SECTIONS).
alter table public.roadmaps drop constraint roadmaps_current_section_check;
alter table public.roadmaps add constraint roadmaps_current_section_check check (current_section between 1 and 13);
