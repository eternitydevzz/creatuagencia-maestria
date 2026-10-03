// Edge Function `agent-chat`: conversa como la secretaria virtual de un negocio (simulador de WhatsApp del panel).
// Es sin estado: el navegador manda la conversación y la función devuelve la siguiente respuesta. Las instrucciones se construyen
// aquí a partir de la ficha guardada del agente (nunca viajan desde el navegador). No cobra créditos (modelo pequeño); sí limita
// el ritmo y el tamaño de la conversación para que no pueda usarse como proxy libre hacia Claude.
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { buildAgentPrompt, nowText, type AgentConfig } from '../_shared/agent.ts'

const MODEL = Deno.env.get('AGENT_MODEL') ?? 'claude-haiku-4-5-20251001'
const PER_MINUTE = Number(Deno.env.get('AGENT_CHAT_PER_MINUTE') ?? 20)
const PER_HOUR = Number(Deno.env.get('AGENT_CHAT_PER_HOUR') ?? 300)
const MAX_TURNS = 40          // mensajes de la conversación que se aceptan
const MAX_CHARS = 1000        // por mensaje
const MAX_TOKENS = 450        // una respuesta de WhatsApp es corta
const TIMEOUT_MS = 30_000

class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code) }
}

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })

type Turn = { role: 'user' | 'assistant'; content: string }

/** Valida la conversación: alterna usuario/asistente, empieza y acaba con el usuario, y respeta los límites de tamaño. */
function parseMessages(raw: unknown): Turn[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS) throw new HttpError(400, 'invalid_params', 'Conversación inválida')
  const turns: Turn[] = raw.map((m) => {
    const role = (m as { role?: unknown })?.role
    const content = (m as { content?: unknown })?.content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') throw new HttpError(400, 'invalid_params', 'Mensaje inválido')
    const text = content.trim()
    if (!text || text.length > MAX_CHARS) throw new HttpError(400, 'invalid_params', `Cada mensaje debe tener entre 1 y ${MAX_CHARS} caracteres`)
    return { role, content: text }
  })
  if (turns[0].role !== 'user' || turns[turns.length - 1].role !== 'user') throw new HttpError(400, 'invalid_params', 'La conversación debe empezar y acabar con un mensaje del usuario')
  for (let i = 1; i < turns.length; i++) if (turns[i].role === turns[i - 1].role) throw new HttpError(400, 'invalid_params', 'Los mensajes deben alternarse')
  return turns
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  try {
    if (!Deno.env.get('ANTHROPIC_API_KEY')) throw new HttpError(503, 'ai_not_configured', 'La IA no está configurada en el servidor')
    const url = Deno.env.get('SUPABASE_URL')!
    const userDb = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false } })
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

    const { data: auth } = await userDb.auth.getUser()
    if (!auth?.user) throw new HttpError(401, 'unauthorized')
    const userId = auth.user.id

    const raw = await req.text()
    if (raw.length > 60_000) throw new HttpError(413, 'payload_too_large')
    const body = JSON.parse(raw || '{}')
    if (typeof body.agent_id !== 'string' || body.agent_id.length > 64) throw new HttpError(400, 'invalid_params', 'agent_id inválido')
    const turns = parseMessages(body.messages)

    // El agente se lee con el token del alumno: la seguridad por filas garantiza que es suyo
    const { data: agent } = await userDb.from('agents').select('id, config').eq('id', body.agent_id).maybeSingle()
    if (!agent) throw new HttpError(404, 'agent_not_found')
    const config = agent.config as AgentConfig

    // Límite de ritmo por minuto y por hora (solo se guarda la fecha de cada mensaje, no su contenido)
    const count = async (ms: number) => (await admin.from('agent_chat_log').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', new Date(Date.now() - ms).toISOString())).count ?? 0
    if ((await count(60_000)) >= PER_MINUTE || (await count(3_600_000)) >= PER_HOUR) throw new HttpError(429, 'rate_limited', 'Vas muy rápido. Espera unos segundos.')
    await admin.from('agent_chat_log').insert({ user_id: userId })
    if (Math.random() < 0.05) await admin.from('agent_chat_log').delete().eq('user_id', userId).lt('created_at', new Date(Date.now() - 24 * 3_600_000).toISOString())

    const system = buildAgentPrompt(config, nowText(config.negocio?.zona_horaria))
    const msg = await anthropic.messages.create({ model: MODEL, max_tokens: MAX_TOKENS, system, messages: turns }, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    const reply = (msg.content as Array<{ type: string; text?: string }>).filter((b) => b.type === 'text').map((b) => b.text ?? '').join('').trim()
    if (!reply) throw new HttpError(502, 'ai_error', 'La secretaria no respondió. Inténtalo de nuevo.')
    return json({ reply })
  } catch (e) {
    let status = 500, code = 'internal_error', message = 'Error inesperado'
    if (e instanceof HttpError) { status = e.status; code = e.code; message = e.message }
    else if (e instanceof Anthropic.RateLimitError) { status = 429; code = 'ai_busy'; message = 'La IA está saturada. Inténtalo en un momento.' }
    else if (e instanceof Anthropic.APIError || (e instanceof DOMException && e.name === 'TimeoutError')) { status = 502; code = 'ai_error'; message = 'La secretaria no respondió. Inténtalo de nuevo.' }
    else if (e instanceof SyntaxError) { status = 400; code = 'invalid_json'; message = 'Petición mal formada' }
    console.error('[agent-chat]', code, e instanceof Error ? e.message : e)
    return json({ error: code, message }, status)
  }
})
