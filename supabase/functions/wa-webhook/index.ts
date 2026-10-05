// Edge Function `wa-webhook`: el servidor de WhatsApp (WAHA) avisa aquí de cada mensaje y de los cambios de estado.
// No lleva sesión de usuario: se autentica con la firma HMAC-SHA512 del cuerpo (secreto WA_WEBHOOK_SECRET).
// El agente SOLO RESPONDE a quien le escribe: nunca inicia conversaciones (así no hay mensajes en frío, que es lo que más banea).
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { json } from '../_shared/cors.ts'
import { mergeTurns, splitReply, type AgentConfig, type Turn } from '../_shared/agent.ts'
import { agentReply } from '../_shared/agentReply.ts'
import { mapStatus, phoneOf, waha } from '../_shared/waha.ts'

const SECRET = Deno.env.get('WA_WEBHOOK_SECRET') ?? ''
const MAX_REPLIES_PER_DAY = Number(Deno.env.get('WA_MAX_REPLIES_PER_DAY') ?? 200)   // por número
const MAX_REPLIES_PER_CHAT_HOUR = Number(Deno.env.get('WA_MAX_REPLIES_PER_CHAT_HOUR') ?? 30)
const DEBOUNCE_MS = Number(Deno.env.get('WA_DEBOUNCE_MS') ?? 2500)                   // espera por si el cliente manda varios mensajes seguidos
const PAUSE_HOURS = Number(Deno.env.get('WA_PAUSE_HOURS') ?? 6)                      // el agente se calla si el dueño contesta desde su móvil
const MAX_AGE_S = 300                                                                 // no se contesta a mensajes atrasados (p. ej. tras reconectar)
const KEEP_DAYS = 30                                                                  // retención de mensajes

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '' })
const url = Deno.env.get('SUPABASE_URL')!
const admin: SupabaseClient = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- firma
async function validSignature(raw: string, signature: string): Promise<boolean> {
  if (!SECRET || !signature) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw)))
  const expected = [...mac].map((b) => b.toString(16).padStart(2, '0')).join('')
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.toLowerCase().charCodeAt(i)
  return diff === 0
}

// ---------------------------------------------------------------- mensajes
type Row = { role: 'user' | 'assistant' | 'owner'; content: string }

/** Historial de las últimas 24 h como turnos alternos que empiezan y acaban con el cliente (lo que exige la API). */
function toTurns(rows: Row[]): Turn[] {
  // lo que escribe el dueño desde su móvil cuenta como respuesta del negocio
  const turns = mergeTurns(rows.map((r): Turn => ({ role: r.role === 'user' ? 'user' : 'assistant', content: r.content })))
  while (turns.length && turns[0].role !== 'user') turns.shift()
  while (turns.length && turns[turns.length - 1].role !== 'user') turns.pop()
  return turns
}

// deno-lint-ignore no-explicit-any
async function onMessage(evt: any) {
  const p = evt.payload ?? {}
  const chatId: string = String((p.fromMe ? p.to : p.from) ?? '')
  // Solo conversaciones individuales (las sesiones ya ignoran grupos, estados y canales; esto es un seguro)
  if (!/@(c\.us|lid)$/.test(chatId)) return

  const { data: conn } = await admin.from('whatsapp_connections').select('*').eq('session', evt.session).maybeSingle()
  if (!conn) return

  const upsertConversation = async (name?: string) => {
    const { data: found } = await admin.from('wa_conversations').select('*').eq('connection_id', conn.id).eq('chat_id', chatId).maybeSingle()
    if (found) return found
    const { data: created } = await admin.from('wa_conversations').insert({ user_id: conn.user_id, connection_id: conn.id, chat_id: chatId, contact_name: name?.slice(0, 80) ?? null }).select('*').single()
    return created ?? (await admin.from('wa_conversations').select('*').eq('connection_id', conn.id).eq('chat_id', chatId).single()).data
  }

  // ---- mensaje del dueño escrito desde su móvil: el agente se calla un rato (y no se confunde con lo que envía la propia API)
  if (p.fromMe) {
    if (evt.event !== 'message.any' || p.source !== 'app') return
    const conv = await upsertConversation()
    await admin.from('wa_conversations').update({ paused_until: new Date(Date.now() + PAUSE_HOURS * 3_600_000).toISOString() }).eq('id', conv.id)
    const text = String(p.body ?? '').trim()
    if (text) await admin.from('wa_messages').insert({ user_id: conn.user_id, conversation_id: conv.id, role: 'owner', content: text.slice(0, 2000), wa_id: p.id ? String(p.id) : null })
    return
  }
  if (evt.event !== 'message') return
  if (typeof p.timestamp === 'number' && Date.now() / 1000 - p.timestamp > MAX_AGE_S) return

  const text = String(p.body ?? '').trim().slice(0, 1000)
  const mediaOnly = !text && !!p.hasMedia
  if (!text && !mediaOnly) return

  // ---- tope diario del número
  const today = new Date().toISOString().slice(0, 10)
  let repliesToday = conn.replies_day === today ? conn.replies_today : 0
  if (repliesToday >= MAX_REPLIES_PER_DAY) return

  const conv = await upsertConversation(evt.payload?._data?.pushName ?? evt.payload?._data?.notifyName)
  const content = text || '[el cliente envió un archivo o nota de voz]'
  const { data: mine, error: insErr } = await admin.from('wa_messages')
    .insert({ user_id: conn.user_id, conversation_id: conv.id, role: 'user', content, wa_id: p.id ? String(p.id) : null }).select('id').single()
  if (insErr) { if (insErr.code !== '23505') console.error('[wa-webhook] insert', insErr.message); return } // 23505: reenvío del mismo mensaje
  await admin.from('wa_conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conv.id)
  if (conv.paused_until && new Date(conv.paused_until) > new Date()) return // el dueño está atendiendo

  // ---- si el cliente manda varios mensajes seguidos, solo responde el último
  await sleep(DEBOUNCE_MS)
  const { data: latest } = await admin.from('wa_messages').select('id, role').eq('conversation_id', conv.id).order('id', { ascending: false }).limit(1).single()
  if (!latest || latest.id !== mine.id) return

  const since = new Date(Date.now() - 3_600_000).toISOString()
  const { count: lastHour } = await admin.from('wa_messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('role', 'assistant').gte('created_at', since)
  if ((lastHour ?? 0) >= MAX_REPLIES_PER_CHAT_HOUR) return

  const send = (t: string) => waha('/api/sendText', { body: { session: conn.session, chatId, text: t } })
  const typing = (on: boolean) => waha(on ? '/api/startTyping' : '/api/stopTyping', { body: { session: conn.session, chatId } }).catch(() => null)
  await waha('/api/sendSeen', { body: { session: conn.session, chatId } }).catch(() => null)

  let reply: string
  let booking = null
  if (mediaOnly) {
    reply = 'Por aquí solo puedo leer mensajes de texto. ¿Me cuentas por escrito lo que necesitas?'
  } else {
    const { data: agent } = await admin.from('agents').select('config').eq('id', conn.agent_id).single()
    if (!agent) return
    const dayAgo = new Date(Date.now() - 24 * 3_600_000).toISOString()
    const { data: rows } = await admin.from('wa_messages').select('role, content').eq('conversation_id', conv.id).gte('created_at', dayAgo).order('id', { ascending: false }).limit(30)
    const turns = toTurns(((rows ?? []) as Row[]).reverse())
    if (!turns.length) return
    await typing(true)
    try {
      const r = await agentReply(anthropic, agent.config as AgentConfig, turns, 25_000)
      reply = r.text; booking = r.booking
    } catch (e) {
      console.error('[wa-webhook] ia', e instanceof Error ? e.message : e)
      await typing(false)
      return // sin respuesta es mejor que una respuesta rota; el dueño ve el mensaje en el panel
    }
    if (!reply) { await typing(false); return }
  }

  // ---- enviar (en varias burbujas, con pausas como una persona) y guardar
  const parts = splitReply(reply)
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) { await typing(true); await sleep(Math.min(1800, 500 + parts[i].length * 12)) }
    const r = await send(parts[i])
    if (r.status >= 300) { console.error('[wa-webhook] sendText', r.status); return }
  }
  await admin.from('wa_messages').insert({ user_id: conn.user_id, conversation_id: conv.id, role: 'assistant', content: reply.slice(0, 2000) })
  await admin.from('whatsapp_connections').update({ replies_day: today, replies_today: repliesToday + 1 }).eq('id', conn.id)
  if (booking) {
    await admin.from('bookings').insert({
      user_id: conn.user_id, connection_id: conn.id, conversation_id: conv.id, name: booking.nombre ?? conv.contact_name ?? null,
      phone: booking.telefono ?? phoneOf(chatId), service: booking.servicio ?? null, when_text: booking.cuando ?? null, notes: booking.notas ?? null,
    })
  }
  // Retención: de vez en cuando se borran los mensajes de más de 30 días
  if (Math.random() < 0.02) await admin.from('wa_messages').delete().lt('created_at', new Date(Date.now() - KEEP_DAYS * 86_400_000).toISOString())
}

// deno-lint-ignore no-explicit-any
async function onStatus(evt: any) {
  const status = mapStatus(evt.payload?.status)
  const phone = phoneOf(evt.me?.id)
  await admin.from('whatsapp_connections').update({ status, ...(phone ? { phone } : {}) }).eq('session', evt.session)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const raw = await req.text()
  if (raw.length > 300_000) return json({ error: 'payload_too_large' }, 413)
  if (!(await validSignature(raw, req.headers.get('x-webhook-hmac') ?? ''))) return json({ error: 'unauthorized' }, 401)
  let evt
  try { evt = JSON.parse(raw) } catch { return json({ error: 'invalid_json' }, 400) }

  // Se responde ya (WAHA reintenta si tarda) y el trabajo sigue en segundo plano
  const work = (async () => {
    try {
      if (evt.event === 'session.status') await onStatus(evt)
      else if (evt.event === 'message' || evt.event === 'message.any') await onMessage(evt)
    } catch (e) { console.error('[wa-webhook]', e instanceof Error ? e.message : e) }
  })()
  // deno-lint-ignore no-explicit-any
  ;(globalThis as any).EdgeRuntime?.waitUntil?.(work)
  return json({ ok: true })
})
