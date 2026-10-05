-- Latencia real de las generaciones con IA, por tipo.
-- La tabla `generations` ya guarda created_at, finished_at, input_tokens y output_tokens: no hace falta instrumentar nada.
--   psql "$DATABASE_URL" -f scripts/latency.sql
-- o pégalo en el SQL Editor de Supabase.

-- 1. Cuánto tarda cada tipo y cuánto de la salida es razonamiento (no entregable).
--    `output_tokens` incluye los tokens de pensamiento: restando el tamaño del JSON que acaba guardado
--    sale cuánto se está gastando en pensar. Referencia medida sobre el proyecto de ejemplo:
--      ideal_client ~2.581 tok de JSON · agency_offer ~3.251 · agency_site ~2.956 · agent ~1.088
select
  kind,
  model,
  count(*)                                                            as n,
  round(avg(extract(epoch from finished_at - created_at))::numeric, 1) as seg_medio,
  round((percentile_cont(0.5) within group (order by extract(epoch from finished_at - created_at)))::numeric, 1) as seg_p50,
  round((percentile_cont(0.95) within group (order by extract(epoch from finished_at - created_at)))::numeric, 1) as seg_p95,
  max(round(extract(epoch from finished_at - created_at)::numeric, 1)) as seg_max,
  round(avg(input_tokens))                                            as in_tok,
  round(avg(output_tokens))                                           as out_tok,
  -- tokens por segundo: si baja mucho, el cuello es el modelo; si es alto y aun así tarda, el cuello está fuera
  round((avg(output_tokens) / nullif(avg(extract(epoch from finished_at - created_at)), 0))::numeric, 1) as tok_seg
from public.generations
where status = 'succeeded' and finished_at is not null
group by kind, model
order by seg_medio desc;

-- 2. Cuántas se van por tiempo o por formato inválido (cada reintento por JSON malo duplica la espera).
select
  kind,
  count(*) filter (where status = 'succeeded')                      as ok,
  count(*) filter (where status = 'failed')                         as fallidas,
  count(*) filter (where error like 'invalid_model_output%')         as json_invalido,
  count(*) filter (where error like 'timeout%')                     as timeouts,
  count(*) filter (where status = 'running')                        as colgadas
from public.generations
group by kind
order by fallidas desc;

-- 3. Las 20 más lentas, para mirar casos concretos.
select kind, model, input_tokens, output_tokens,
       round(extract(epoch from finished_at - created_at)::numeric, 1) as seg,
       created_at
from public.generations
where status = 'succeeded' and finished_at is not null
order by finished_at - created_at desc
limit 20;
