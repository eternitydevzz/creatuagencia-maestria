// Edge Function `agent-chat`: conversa como la secretaria virtual de un negocio (simulador de WhatsApp del panel y link público
// de una demo, que abre el prospecto del alumno sin cuenta).
// Es sin estado: el navegador manda la conversación y la función devuelve la siguiente respuesta. Las instrucciones se construyen
// aquí a partir de la ficha guardada del agente (nunca viajan desde el navegador). No cobra créditos (modelo pequeño); sí limita
// el ritmo y el tamaño de la conversación para que no pueda usarse como proxy libre hacia Claude.
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import type { AgentConfig } from '../_shared/agent.ts'
import { agentReply } from '../_shared/agentReply.ts'
import { isApproved, NOT_APPROVED_MESSAGE } from '../_shared/approval.ts'

const PER_MINUTE = Number(Deno.env.get('AGENT_CHAT_PER_MINUTE') ?? 20)
const PER_HOUR = Number(Deno.env.get('AGENT_CHAT_PER_HOUR') ?? 300)
// Link público de una demo (…/d/<código>): lo abre un prospecto sin cuenta, así que cada link tiene sus propios topes, además del
// total por hora del alumno dueño de la demo (PER_HOUR). Con el modelo pequeño, el tope diario cuesta céntimos.
const PUBLIC_PER_MINUTE = Number(Deno.env.get('DEMO_LINK_PER_MINUTE') ?? 8)
const PUBLIC_PER_DAY = Number(Deno.env.get('DEMO_LINK_PER_DAY') ?? 80)
const MAX_TURNS = 40          // mensajes de la conversación que se aceptan
const MAX_CHARS = 1000        // por mensaje
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

    const raw = await req.text()
    if (raw.length > 60_000) throw new HttpError(413, 'payload_too_large')
    const body = JSON.parse(raw || '{}')
    const turns = parseMessages(body.messages)

    // Límite de ritmo. Solo se guarda la fecha de cada mensaje (no su contenido). Primero se registra el mensaje y después se
    // cuenta incluyéndolo: así, aunque lleguen muchas peticiones a la vez, como mucho pasan tantas como permite el límite (contar
    // primero y registrar después dejaría pasar todas las que leyeran el contador a la vez). Si la base falla, se corta: un límite
    // que se apaga con un error no protege nada, y menos en el link público.
    const record = async (row: { user_id: string; agent_id?: string }) => {
      const { error } = await admin.from('agent_chat_log').insert(row)
      if (error) throw new HttpError(503, 'unavailable', 'No se pudo enviar el mensaje. Inténtalo en un momento.')
    }
    const count = async (field: 'user_id' | 'agent_id', value: string, ms: number) => {
      const { count: n, error } = await admin.from('agent_chat_log').select('id', { count: 'exact', head: true }).eq(field, value).gte('created_at', new Date(Date.now() - ms).toISOString())
      if (error || n === null) throw new HttpError(503, 'unavailable', 'No se pudo enviar el mensaje. Inténtalo en un momento.')
      return n
    }
    const purge = (field: 'user_id' | 'agent_id', value: string) => // los registros de más de un día ya no cuentan para ningún límite
      Math.random() < 0.05 ? admin.from('agent_chat_log').delete().eq(field, value).lt('created_at', new Date(Date.now() - 24 * 3_600_000).toISOString()) : null

    let config: AgentConfig
    if (body.share_token !== undefined) {
      // ---- link público de una demo: sin cuenta. Vale el código, mientras no venza ni se desactive ----
      if (typeof body.share_token !== 'string' || body.share_token.length < 16 || body.share_token.length > 64) throw new HttpError(404, 'demo_link_invalid')
      const { data: agent } = await admin.from('agents').select('id, user_id, config')
        .eq('share_token', body.share_token).eq('source', 'demo').gt('share_expires_at', new Date().toISOString()).maybeSingle()
      if (!agent) throw new HttpError(404, 'demo_link_invalid')
      await record({ user_id: agent.user_id, agent_id: agent.id })
      if ((await count('agent_id', agent.id, 60_000)) > PUBLIC_PER_MINUTE) throw new HttpError(429, 'rate_limited', 'Vas muy rápido. Espera unos segundos.')
      if ((await count('agent_id', agent.id, 24 * 3_600_000)) > PUBLIC_PER_DAY || (await count('user_id', agent.user_id, 3_600_000)) > PER_HOUR)
        throw new HttpError(429, 'demo_link_busy', 'Esta demo ha recibido muchos mensajes hoy. Vuelve a probar mañana.')
      await purge('agent_id', agent.id)
      config = agent.config as AgentConfig
    } else {
      // ---- simulador del panel: el alumno con su sesión ----
      const { data: auth } = await userDb.auth.getUser()
      if (!auth?.user) throw new HttpError(401, 'unauthorized')
      const userId = auth.user.id
      if (!(await isApproved(admin, userId))) throw new HttpError(403, 'not_approved', NOT_APPROVED_MESSAGE)
      if (typeof body.agent_id !== 'string' || body.agent_id.length > 64) throw new HttpError(400, 'invalid_params', 'agent_id inválido')

      // El agente se lee con el token del alumno: la seguridad por filas garantiza que es suyo
      const { data: agent } = await userDb.from('agents').select('id, config').eq('id', body.agent_id).maybeSingle()
      if (!agent) throw new HttpError(404, 'agent_not_found')
      config = agent.config as AgentConfig

      await record({ user_id: userId })
      if ((await count('user_id', userId, 60_000)) > PER_MINUTE || (await count('user_id', userId, 3_600_000)) > PER_HOUR) throw new HttpError(429, 'rate_limited', 'Vas muy rápido. Espera unos segundos.')
      await purge('user_id', userId)
    }

    // Si la secretaria cierra una cita, la marca se separa del texto: el simulador la enseña como tarjeta (aquí no se guarda)
    const { text, booking } = await agentReply(anthropic, config, turns, TIMEOUT_MS)
    if (!text) throw new HttpError(502, 'ai_error', 'La secretaria no respondió. Inténtalo de nuevo.')
    return json({ reply: text, booking })
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
