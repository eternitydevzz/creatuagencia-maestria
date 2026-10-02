-- MaestrIA · simplificación: quitamos del mapa de ruta "Agente 24/7" (el prompt del setter de la propia agencia)
-- y "Agente IA" (probarlo en un chat simulado): añadían complejidad y no aportaban al objetivo de vender.
-- El informe ejecutivo también se retira; el kit de ventas ya cubre cerrar al cliente.
alter table public.roadmaps drop column generated_setter_prompt;
alter table public.roadmaps drop column generated_report;

-- El número de secciones ya no es una cifra fija en la base de datos: el máximo real lo valida el frontend
-- (SECTIONS.length en gamification.ts), así que aquí solo exigimos un valor positivo.
alter table public.roadmaps drop constraint roadmaps_current_section_check;
alter table public.roadmaps add constraint roadmaps_current_section_check check (current_section >= 1);
