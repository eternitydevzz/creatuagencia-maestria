// Edge Function `generate`: única puerta de entrada a Claude.
// La clave de Anthropic vive solo aquí (secreto del servidor). El navegador manda un tipo de generación y
// parámetros acotados; los prompts se construyen en prompts.ts a partir de los datos guardados del proyecto.
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { problemLabel } from '../_shared/catalog.ts'
import { inputsSignature, type DeliverableMeta } from '../_shared/signature.ts'
import * as P from './prompts.ts'
import { FetchError, fetchSite } from './fetchSite.ts'
import { cleanConfig } from '../_shared/agent.ts'

// ---------------------------------------------------------------- configuración
const MODEL = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5'
// Los agentes de atención usan un modelo rápido y barato: son fichas cortas, y el chat posterior (agent-chat) usa el mismo
const AGENT_MODEL = Deno.env.get('AGENT_MODEL') ?? 'claude-haiku-4-5-20251001'
const USE_FALLBACKS = (Deno.env.get('ANTHROPIC_FALLBACKS') ?? 'on') !== 'off'
// El razonamiento del modelo es lo que más tiempo consume: la salida útil son ~3.000 tokens, pero el modelo genera muchos
// más pensando. En Sonnet 5.5 no se puede mandar thinking:{type:'disabled'} (da 400); la forma de apagarlo es
// 'between_tools', que solo piensa entre llamadas a herramientas — y aquí no hay ninguna, así que no piensa nada.
// Se admite con effort 'high' o menos (los nuestros son 'low' y 'medium') y no acepta ningún otro campo.
//   ANTHROPIC_THINKING=off   → sin razonamiento: lo más rápido y barato
//   ANTHROPIC_THINKING=on    → razonamiento adaptativo (por defecto), acotado por `effort`
// Mide los dos con scripts/latency.sql antes de fijar uno.
const THINKING_OFF = (Deno.env.get('ANTHROPIC_THINKING') ?? 'on') === 'off'
const RATE_LIMIT_PER_MINUTE = Number(Deno.env.get('RATE_LIMIT_PER_MINUTE') ?? 10)
// Tiempo máximo de una generación. Debe quedar por debajo del límite de la función en tu plan de Supabase (150 s en Free, 400 s en Pro):
// así falla de forma limpia, con los créditos devueltos, en vez de que la plataforma corte la función a medias.
const TIMEOUT_MS = Number(Deno.env.get('GENERATION_TIMEOUT_SECONDS') ?? 140) * 1000
// Cada cuántos segundos se envía un latido al navegador mientras Claude trabaja (Supabase corta las conexiones mudas a los 60 s)
const HEARTBEAT_MS = Number(Deno.env.get('HEARTBEAT_SECONDS') ?? 8) * 1000

type Effort = 'low' | 'medium' | 'high'
// `model` distinto del principal → sin effort ni fallbacks (son parámetros del modelo grande)
interface KindDef { cost: number; effort?: Effort; model?: string; maxTokens: number; valid: (v: unknown) => boolean }

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
  agent: {
    cost: 1, model: AGENT_MODEL, maxTokens: 6000,
    valid: (v) => isObj(v) && isObj(v.negocio) && hasText(v.negocio.nombre) && hasText(v.negocio.rubro) && Array.isArray(v.servicios) && v.servicios.length >= 1
      && v.servicios.every((x) => isObj(x) && hasText(x.nombre)) && isObj(v.secretaria) && hasText(v.secretaria.nombre) && hasText(v.secretaria.saludo),
  },
  // Demo para el negocio de un cliente del alumno (desde su web o a mano). Mismo formato de ficha que `agent`.
  demo_agent: {
    cost: 1, model: AGENT_MODEL, maxTokens: 6000,
    // Una web sin servicios claros es válida: la secretaria atiende con lo que haya y no inventa el resto
    valid: (v) => isObj(v) && isObj(v.negocio) && hasText(v.negocio.nombre) && Array.isArray(v.servicios)
      && v.servicios.every((x) => isObj(x) && hasText(x.nombre)) && isObj(v.secretaria) && hasText(v.secretaria.nombre) && hasText(v.secretaria.saludo),
  },
}
const MAX_DEMOS_PER_PROJECT = 10

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

async function complete(def: KindDef, system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>, signal: AbortSignal): Promise<Completion> {
  const base = {
    model: def.model ?? MODEL,
    max_tokens: def.maxTokens,
    system,
    messages,
    ...(def.effort ? { output_config: { effort: def.effort } } : {}),
    // Solo para el modelo principal: las fichas de agente van con un modelo pequeño que no admite estos parámetros
    ...(!def.model && THINKING_OFF ? { thinking: { type: 'between_tools' as const } } : {}),
  }
  const run = async (withFallbacks: boolean) => {
    // Streaming: max_tokens altos y respuestas largas superarían el timeout de una petición normal.
    const stream = withFallbacks
      // deno-lint-ignore no-explicit-any
      ? (anthropic.beta.messages as any).stream({ ...base, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, { signal })
      // deno-lint-ignore no-explicit-any
      : (anthropic.messages as any).stream(base, { signal })
    return await stream.finalMessage()
  }
  // Los fallbacks reenvían la misma petición a otro modelo si el actual la rechaza por seguridad. No está documentado que
  // ese otro modelo acepte 'between_tools', y un 400 ahí tumbaría la generación entera: con el razonamiento apagado,
  // preferimos quedarnos sin refuerzo (un rechazo por seguridad es rarísimo con este contenido) antes que arriesgar eso.
  const fallbacks = USE_FALLBACKS && !def.model && !THINKING_OFF
  let msg
  try {
    msg = await run(fallbacks)
  } catch (e) {
    // Si la plataforma rechazara el parámetro de fallback, reintentamos una vez sin él.
    if (fallbacks && e instanceof Anthropic.BadRequestError && /fallback|beta/i.test(e.message)) msg = await run(false)
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
// Dos fases. Antes de llamar a Claude (sesión, validación, cobro) los errores son respuestas HTTP normales. La generación en sí
// tarda de decenas de segundos a un par de minutos, así que se responde ya con 200 y se manda un latido mientras trabaja; el
// resultado (o el error, con `status`) llega al final como JSON. Los espacios iniciales no afectan al JSON.
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
  const deadline = Date.now() + TIMEOUT_MS

  /** Convierte cualquier fallo en respuesta y, si ya se había cobrado, devuelve los créditos al alumno. */
  const failure = async (e: unknown): Promise<{ status: number; payload: Record<string, unknown> }> => {
    let status = 500
    let code = 'internal_error'
    let message = 'Error inesperado'
    if (e instanceof HttpError) { status = e.status; code = e.code; message = e.message }
    else if (Date.now() >= deadline - 1000) { status = 504; code = 'timeout'; message = 'La IA ha tardado demasiado' }
    else if (e instanceof Anthropic.RateLimitError) { status = 429; code = 'ai_busy'; message = 'La IA está saturada. Inténtalo en un momento.' }
    else if (e instanceof Anthropic.APIError) { status = 502; code = 'ai_error'; message = 'La IA no respondió correctamente. Inténtalo de nuevo.' }
    else if (e instanceof SyntaxError) { status = 400; code = 'invalid_json'; message = 'Petición mal formada' }
    console.error('[generate]', code, e instanceof Error ? e.message : e)

    // Nada de aquí abajo puede lanzar: esta función se llama desde el catch de `work()`, y si rechazara, el stream
    // moriría sin cuerpo y el alumno se quedaría sin respuesta Y sin reembolso. Si la DB falla, lo recoge
    // `sweep_stale_generations` en la siguiente generación (a los 6 minutos).
    let creditsLeft: number | undefined
    try {
      if (charged > 0 && userId) {
        const { data } = await admin.rpc('refund_credits', { p_user: userId, p_amount: charged, p_reason: `reembolso: ${code}`, p_generation: generationId })
        if (typeof data === 'number') creditsLeft = data
        charged = 0
      }
      if (generationId) await admin.from('generations').update({ status: 'failed', error: `${code}: ${message}`.slice(0, 500), finished_at: new Date().toISOString() }).eq('id', generationId)
    } catch (inner) {
      console.error('[generate] fallo al reembolsar o al cerrar la generación', inner instanceof Error ? inner.message : inner)
    }
    return { status, payload: { error: code, message, credits_left: creditsLeft } }
  }

  try {
    if (!Deno.env.get('ANTHROPIC_API_KEY')) throw new HttpError(503, 'ai_not_configured', 'La IA no está configurada en el servidor')

    // La sesión, el cuerpo de la petición y el proyecto no dependen entre sí: se piden a la vez.
    // (El proyecto se lee con el token del alumno, así que la seguridad por filas sigue mandando aunque la sesión falle.)
    const rawP = req.text()
    const authP = userDb.auth.getUser()
    const { data: auth } = await authP
    if (!auth?.user) throw new HttpError(401, 'unauthorized')
    userId = auth.user.id

    const raw = await rawP
    if (raw.length > 120_000) throw new HttpError(413, 'payload_too_large')
    const body = JSON.parse(raw || '{}')
    const kind = str(body.kind, 40, 'kind')
    const def = KINDS[kind]
    if (!def) throw new HttpError(400, 'unknown_kind')
    const params = (body.params && typeof body.params === 'object') ? body.params : {}
    const roadmapId = str(body.roadmap_id, 64, 'roadmap_id')

    // El proyecto se lee con el token del alumno: la seguridad por filas garantiza que es suyo.
    const { data: roadmap, error: rErr } = await userDb.from('roadmaps').select('*').eq('id', roadmapId).maybeSingle()
    if (rErr || !roadmap) throw new HttpError(404, 'roadmap_not_found')
    const ctx = ctxFromRoadmap(roadmap)

    // ---- construir el prompt (validando parámetros) ----
    let prompt = ''
    let demoOrigin: { tipo: 'url' | 'manual'; url?: string } | undefined
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
      case 'agent': prompt = P.agentConfig(ctx); break
      case 'demo_agent': {
        const { count: nDemos } = await userDb.from('agents').select('id', { count: 'exact', head: true }).eq('roadmap_id', roadmapId).eq('source', 'demo')
        if ((nDemos ?? 0) >= MAX_DEMOS_PER_PROJECT) throw new HttpError(409, 'demo_limit', `Máximo ${MAX_DEMOS_PER_PROJECT} demos por proyecto. Borra alguna para crear otra.`)
        const rawUrl = typeof params.url === 'string' ? params.url.trim() : ''
        if (rawUrl) {
          if (rawUrl.length > 300) throw new HttpError(400, 'url_invalid', 'La dirección es demasiado larga')
          try {
            // Se descarga la web ANTES de cobrar: si no se puede abrir, el alumno no paga nada
            const site = await fetchSite(rawUrl)
            demoOrigin = { tipo: 'url', url: site.url }
            prompt = P.demoAgent({ kind: 'url', url: site.url, text: site.text }, ctx)
          } catch (e) {
            if (e instanceof FetchError) throw new HttpError(e.code === 'url_invalid' || e.code === 'url_blocked' ? 400 : 422, e.code, e.message)
            throw e
          }
        } else {
          const m = (params.manual && typeof params.manual === 'object' ? params.manual : {}) as Record<string, unknown>
          const opt = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
          demoOrigin = { tipo: 'manual' }
          prompt = P.demoAgent({ kind: 'manual', data: {
            nombre: str(m.nombre, 120, 'nombre', 2), rubro: str(m.rubro, 120, 'rubro', 2),
            descripcion: opt(m.descripcion, 500), servicios: opt(m.servicios, 1500), horario: opt(m.horario, 200), ubicacion: opt(m.ubicacion, 200),
          } }, ctx)
        }
        break
      }
    }
    const system = P.systemFor(ctx)
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [{ role: 'user', content: prompt }]

    // ---- límite de ritmo, generación y cobro ----
    // Si una ejecución anterior murió a medias (tiempo máximo de la función), se libera y se devuelven sus créditos.
    // El barrido y el conteo del límite de ritmo no dependen entre sí (el conteo va por fecha, no por estado): en paralelo.
    const since = new Date(Date.now() - 60_000).toISOString()
    const [, { count }] = await Promise.all([
      admin.rpc('sweep_stale_generations', { p_user: userId }),
      admin.from('generations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since),
    ])
    if ((count ?? 0) >= RATE_LIMIT_PER_MINUTE) throw new HttpError(429, 'rate_limited', 'Vas muy rápido. Espera unos segundos.')

    // Un índice único (roadmap_id, kind) sobre las generaciones en curso impide cobrar dos veces lo mismo a la vez.
    const { data: gen, error: gErr } = await admin.from('generations')
      .insert({ user_id: userId, roadmap_id: roadmapId, kind, credits_cost: def.cost, model: def.model ?? MODEL }).select('id').single()
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

    // ---- el trabajo largo: Claude + guardar el resultado ----
    const work = async (): Promise<{ status: number; payload: Record<string, unknown> }> => {
      try {
        // Cada llamada a Claude se corta cuando se agota el tiempo total (la generación y su posible reintento comparten el mismo reloj)
        const left = () => AbortSignal.timeout(Math.max(1000, deadline - Date.now()))
        const parse = (text: string): { ok: true; value: unknown } | { ok: false } => {
          try { const value = extractJson(text); return def.valid(value) ? { ok: true, value } : { ok: false } } catch { return { ok: false } }
        }
        // La respuesta debe ser JSON con la forma que pide la interfaz; si no, un reintento
        let out = await complete(def, system, messages, left())
        let parsed = parse(out.text)
        if (!parsed.ok) {
          const retry = await complete(def, system, [
            ...messages,
            { role: 'assistant', content: out.text.slice(0, 20_000) || '(vacío)' },
            { role: 'user', content: 'Tu respuesta no era JSON válido o no tenía la estructura pedida. Devuelve de nuevo el resultado completo como JSON válido con la estructura EXACTA indicada, sin texto adicional.' },
          ], left())
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
        if (kind === 'agent' || kind === 'demo_agent') {
          // Solo se guardan los campos conocidos de la ficha, con tamaños acotados (el texto puede venir de una web ajena)
          const base = cleanConfig(result)
          if (!base.negocio.nombre || (kind === 'agent' && !base.servicios.length)) throw new HttpError(502, 'invalid_model_output', 'La IA devolvió un formato inesperado')
          const businessName = base.negocio.nombre.slice(0, 120)
          if (kind === 'demo_agent') {
            const cfg = { ...base, origen: demoOrigin }
            const { error: aErr } = await admin.from('agents').insert({ user_id: userId, roadmap_id: roadmapId, source: 'demo', business_name: businessName, config: cfg })
            if (aErr) throw new HttpError(500, 'db_error', aErr.message)
          } else {
            // Un agente de ejemplo por proyecto: se actualiza el que haya o se crea
            const cfg = { ...base, _meta: meta({ ideal_at: rm.ideal_client?._meta?.generated_at ?? null, offer_at: rm.agency_offer?._meta?.generated_at ?? null }) }
            const { data: existing } = await admin.from('agents').select('id').eq('roadmap_id', roadmapId).eq('source', 'niche').maybeSingle()
            const { error: aErr } = existing
              ? await admin.from('agents').update({ business_name: businessName, config: cfg }).eq('id', existing.id)
              : await admin.from('agents').insert({ user_id: userId, roadmap_id: roadmapId, source: 'niche', business_name: businessName, config: cfg })
            if (aErr) throw new HttpError(500, 'db_error', aErr.message)
          }
        }
        if (Object.keys(patch).length) {
          const { error: uErr } = await admin.from('roadmaps').update(patch).eq('id', roadmapId).eq('user_id', userId)
          if (uErr) throw new HttpError(500, 'db_error', uErr.message)
        }

        await admin.from('generations').update({
          status: 'succeeded', input_tokens: out.inputTokens, output_tokens: out.outputTokens, request_id: out.requestId ?? null, finished_at: new Date().toISOString(),
        }).eq('id', generationId)

        return { status: 200, payload: { generation_id: generationId, kind, parsed: result, credits_left: creditsLeft } }
      } catch (e) {
        return await failure(e)
      }
    }

    // El trabajo sigue aunque el alumno cierre la pestaña a medias (waitUntil lo mantiene vivo): se guarda y, si falla, se reembolsa.
    const job = work()
    // deno-lint-ignore no-explicit-any
    ;(globalThis as any).EdgeRuntime?.waitUntil?.(job)

    const enc = new TextEncoder()
    let closed = false
    const stream = new ReadableStream({
      async start(ctrl) {
        const send = (text: string) => { if (!closed) { try { ctrl.enqueue(enc.encode(text)) } catch { closed = true } } }
        const beat = setInterval(() => send('\n'), HEARTBEAT_MS)
        const { status, payload } = await job
        clearInterval(beat)
        send(JSON.stringify(status === 200 ? payload : { ...payload, status }))
        if (!closed) { closed = true; try { ctrl.close() } catch { /* ya cerrado */ } }
      },
      cancel() { closed = true }, // el alumno se fue: el trabajo continúa y queda guardado
    })
    return new Response(stream, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    const { status, payload } = await failure(e)
    return json(payload, status)
  }
})
