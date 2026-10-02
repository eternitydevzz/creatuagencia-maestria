// Edge Function `generate`: única puerta de entrada a Claude.
// La clave de Anthropic vive solo aquí (secreto del servidor). El navegador manda un tipo de generación y
// parámetros acotados; los prompts se construyen en prompts.ts a partir de los datos guardados del proyecto.
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { problemLabel } from '../_shared/catalog.ts'
import { inputsSignature, type DeliverableMeta } from '../_shared/signature.ts'
import * as P from './prompts.ts'

// ---------------------------------------------------------------- configuración
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-5-5'
const USE_FALLBACKS = (Deno.env.get('ANTHROPIC_FALLBACKS') ?? 'on') !== 'off'
const RATE_LIMIT_PER_MINUTE = Number(Deno.env.get('RATE_LIMIT_PER_MINUTE') ?? 10)

type Effort = 'low' | 'medium' | 'high'
interface KindDef { cost: number; effort: Effort; maxTokens: number; valid: (v: unknown) => boolean }

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const hasText = (v: unknown) => typeof v === 'string' && v.trim().length > 0

// Coste en créditos por generación. Es la única tabla de precios: se cambia aquí.
// max_tokens incluye el razonamiento del modelo, por eso va holgado.
// `valid` comprueba que el JSON tiene la forma que la interfaz necesita; si no, se reintenta una vez y, si sigue mal, se devuelven los créditos.
const KINDS: Record<string, KindDef> = {
  custom_problem: { cost: 1, effort: 'low', maxTokens: 6000, valid: (v) => isObj(v) && hasText(v.solution_label) && hasText(v.solution_description) },
  new_niches: { cost: 1, effort: 'low', maxTokens: 8000, valid: (v) => Array.isArray(v) && v.length >= 1 && v.every((n) => isObj(n) && hasText(n.nombre)) },
  ideal_client: { cost: 2, effort: 'medium', maxTokens: 16000, valid: (v) => isObj(v) && hasText(v.resumen) && isObj(v.perfil) && Array.isArray(v.dolores) },
  agency_offer: { cost: 3, effort: 'medium', maxTokens: 20000, valid: (v) => isObj(v) && isObj(v.oferta) && hasText(v.oferta.nombre) && isObj(v.oferta.precio) },
  agency_site: { cost: 3, effort: 'medium', maxTokens: 20000, valid: (v) => isObj(v) && isObj(v.hero) && hasText(v.hero.titulo) },
}

class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code) }
}

// ---------------------------------------------------------------- utilidades
const str = (v: unknown, max: number, field: string, min = 1): string => {
  if (typeof v !== 'string') throw new HttpError(400, 'invalid_params', `${field} inválido`)
  const t = v.trim()
  if (t.length < min || t.length > max) throw new HttpError(400, 'invalid_params', `${field}: longitud fuera de rango`)
  return t
}

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  try { return JSON.parse(cleaned) } catch { /* intentamos localizar el bloque */ }
  const start = cleaned.search(/[\[{]/)
  const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'))
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
  throw new Error('json_parse_failed')
}

// ---------------------------------------------------------------- llamada a Claude
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })

interface Completion { text: string; inputTokens: number; outputTokens: number; requestId?: string }

async function complete(def: KindDef, system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<Completion> {
  const base = {
    model: MODEL,
    max_tokens: def.maxTokens,
    system,
    messages,
    output_config: { effort: def.effort },
  }
  const run = async (withFallbacks: boolean) => {
    // Streaming: max_tokens altos y respuestas largas superarían el timeout de una petición normal.
    const stream = withFallbacks
      // deno-lint-ignore no-explicit-any
      ? (anthropic.beta.messages as any).stream({ ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      // deno-lint-ignore no-explicit-any
      : (anthropic.messages as any).stream(base)
    return await stream.finalMessage()
  }
  let msg
  try {
    msg = await run(USE_FALLBACKS)
  } catch (e) {
    // Si la plataforma rechazara el parámetro de fallback, reintentamos una vez sin él.
    if (USE_FALLBACKS && e instanceof Anthropic.BadRequestError && /fallback|beta/i.test(e.message)) msg = await run(false)
    else throw e
  }
  if (msg.stop_reason === 'refusal') throw new HttpError(422, 'refused', 'El modelo no pudo atender esta petición')
  const text = (msg.content as Array<{ type: string; text?: string }>).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('').trim()
  return {
    text, inputTokens: msg.usage?.input_tokens ?? 0, outputTokens: msg.usage?.output_tokens ?? 0,
    requestId: msg._request_id ?? undefined,
  }
}

// ---------------------------------------------------------------- contexto del proyecto
/** Los entregables guardan metadatos internos en `_meta`; a la IA no le hacen falta. */
function withoutMeta(o: Record<string, unknown> | undefined) {
  if (!o) return undefined
  const { _meta: _ignored, ...rest } = o
  return rest
}

// deno-lint-ignore no-explicit-any
function ctxFromRoadmap(r: any): P.Ctx {
  const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : undefined)
  return {
    agencyName: r.agency_name ?? undefined,
    nichos: Array.isArray(r.selected_nichos) ? r.selected_nichos.filter((x: unknown) => typeof x === 'string') : [],
    problems: Array.isArray(r.selected_problems) ? r.selected_problems.filter((x: unknown) => typeof x === 'string') : [],
    custom: r.custom_problem_descriptions ?? {},
    metrics: r.business_metrics ?? {},
    pricing: r.pricing_settings ?? {},
    idealClient: withoutMeta(obj(r.ideal_client)),
    agencyOffer: withoutMeta(obj(r.agency_offer)),
  }
}

// ---------------------------------------------------------------- handler
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization') ?? ''
  const userDb = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } })
  const admin: SupabaseClient = createClient(url, service, { auth: { persistSession: false } })

  let generationId: string | null = null
  let charged = 0
  let userId = ''
  try {
    if (!Deno.env.get('ANTHROPIC_API_KEY')) throw new HttpError(503, 'ai_not_configured', 'La IA no está configurada en el servidor')

    const { data: auth } = await userDb.auth.getUser()
    if (!auth?.user) throw new HttpError(401, 'unauthorized')
    userId = auth.user.id

    const raw = await req.text()
    if (raw.length > 120_000) throw new HttpError(413, 'payload_too_large')
    const body = JSON.parse(raw || '{}')
    const kind = str(body.kind, 40, 'kind', 1)
    const def = KINDS[kind]
    if (!def) throw new HttpError(400, 'unknown_kind')
    const params = (body.params && typeof body.params === 'object') ? body.params : {}
    const roadmapId = str(body.roadmap_id, 64, 'roadmap_id', 1)

    // El proyecto se lee con el token del alumno: la seguridad por filas garantiza que es suyo.
    const { data: roadmap, error: rErr } = await userDb.from('roadmaps').select('*').eq('id', roadmapId).maybeSingle()
    if (rErr || !roadmap) throw new HttpError(404, 'roadmap_not_found')
    const ctx = ctxFromRoadmap(roadmap)

    // ---- construir el prompt (validando parámetros) ----
    let prompt = ''
    switch (kind) {
      case 'custom_problem': {
        const problemName = str(params.problemName, 120, 'problemName', 2)
        prompt = P.customProblem({ problemName, existing: ctx.problems.map((id) => problemLabel(id, ctx.custom)) })
        break
      }
      case 'new_niches': prompt = P.newNiches(ctx); break
      case 'ideal_client': prompt = P.idealClient(ctx); break
      case 'agency_offer': prompt = P.agencyOffer(ctx); break
      case 'agency_site': prompt = P.agencySite(ctx); break
    }
    const system = P.SYSTEM
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [{ role: 'user', content: prompt }]

    // ---- límite de ritmo, generación y cobro ----
    // Si una ejecución anterior murió a medias (tiempo máximo de la función), se libera y se devuelven sus créditos.
    await admin.rpc('sweep_stale_generations', { p_user: userId })

    const since = new Date(Date.now() - 60_000).toISOString()
    const { count } = await admin.from('generations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since)
    if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) throw new HttpError(429, 'rate_limited', 'Vas muy rápido. Espera unos segundos.')

    // Un índice único (roadmap_id, kind) sobre las generaciones en curso impide cobrar dos veces lo mismo a la vez.
    const { data: gen, error: gErr } = await admin.from('generations')
      .insert({ user_id: userId, roadmap_id: roadmapId, kind, credits_cost: def.cost, model: MODEL }).select('id').single()
    if (gErr?.code === '23505') throw new HttpError(409, 'already_running', 'Ya se está generando esto')
    if (gErr || !gen) throw new HttpError(500, 'db_error', gErr?.message)
    generationId = gen.id

    const { data: balance, error: sErr } = await admin.rpc('spend_credits', { p_user: userId, p_cost: def.cost, p_reason: `generación: ${kind}`, p_generation: generationId })
    if (sErr) {
      if (/insufficient_credits/.test(sErr.message)) throw new HttpError(402, 'insufficient_credits', 'No te quedan créditos')
      throw new HttpError(500, 'db_error', sErr.message)
    }
    charged = def.cost
    const creditsLeft = balance as number

    // ---- llamada a Claude: la respuesta debe ser JSON con la forma que pide la interfaz; si no, un reintento ----
    const parse = (text: string): { ok: true; value: unknown } | { ok: false } => {
      try { const value = extractJson(text); return def.valid(value) ? { ok: true, value } : { ok: false } } catch { return { ok: false } }
    }
    let out = await complete(def, system, messages)
    let parsed = parse(out.text)
    if (!parsed.ok) {
      const retry = await complete(def, system, [
        ...messages,
        { role: 'assistant', content: out.text.slice(0, 20_000) || '(vacío)' },
        { role: 'user', content: 'Tu respuesta no era JSON válido o no tenía la estructura pedida. Devuelve de nuevo el resultado completo como JSON válido con la estructura EXACTA indicada, sin texto adicional.' },
      ])
      out = { ...retry, inputTokens: out.inputTokens + retry.inputTokens, outputTokens: out.outputTokens + retry.outputTokens }
      parsed = parse(out.text)
      if (!parsed.ok) throw new HttpError(502, 'invalid_model_output', 'La IA devolvió un formato inesperado')
    }
    const result = parsed.value

    // ---- guardar el resultado en el proyecto, con la huella de las respuestas con las que se generó ----
    // deno-lint-ignore no-explicit-any
    const rm = roadmap as any
    const meta = (extra: Partial<DeliverableMeta> = {}): DeliverableMeta => ({
      generated_at: new Date().toISOString(), inputs: inputsSignature(rm, kind !== 'ideal_client'), ...extra,
    })
    const patch: Record<string, unknown> = {}
    switch (kind) {
      case 'ideal_client': patch.ideal_client = { ...(result as object), _meta: meta() }; break
      case 'agency_offer': patch.agency_offer = { ...(result as object), _meta: meta({ ideal_at: rm.ideal_client?._meta?.generated_at ?? null }) }; break
      case 'agency_site': patch.agency_site = { ...(result as object), _meta: meta({ offer_at: rm.agency_offer?._meta?.generated_at ?? null }) }; break
    }
    if (Object.keys(patch).length) {
      const { error: uErr } = await admin.from('roadmaps').update(patch).eq('id', roadmapId).eq('user_id', userId)
      if (uErr) throw new HttpError(500, 'db_error', uErr.message)
    }

    await admin.from('generations').update({
      status: 'succeeded', input_tokens: out.inputTokens, output_tokens: out.outputTokens, request_id: out.requestId ?? null, finished_at: new Date().toISOString(),
    }).eq('id', generationId)

    return json({ generation_id: generationId, kind, parsed: result, credits_left: creditsLeft })
  } catch (e) {
    // Cualquier fallo tras el cobro devuelve los créditos al alumno.
    let status = 500
    let code = 'internal_error'
    let message = 'Error inesperado'
    if (e instanceof HttpError) { status = e.status; code = e.code; message = e.message }
    else if (e instanceof Anthropic.RateLimitError) { status = 429; code = 'ai_busy'; message = 'La IA está saturada. Inténtalo en un momento.' }
    else if (e instanceof Anthropic.APIError) { status = 502; code = 'ai_error'; message = 'La IA no respondió correctamente. Inténtalo de nuevo.' }
    else if (e instanceof SyntaxError) { status = 400; code = 'invalid_json'; message = 'Petición mal formada' }
    console.error('[generate]', code, e instanceof Error ? e.message : e)

    let creditsLeft: number | undefined
    if (charged > 0 && userId) {
      const { data } = await admin.rpc('refund_credits', { p_user: userId, p_amount: charged, p_reason: `reembolso: ${code}`, p_generation: generationId })
      if (typeof data === 'number') creditsLeft = data
    }
    if (generationId) await admin.from('generations').update({ status: 'failed', error: `${code}: ${message}`.slice(0, 500), finished_at: new Date().toISOString() }).eq('id', generationId)
    return json({ error: code, message, credits_left: creditsLeft }, status)
  }
})
