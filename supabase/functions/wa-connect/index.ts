// Edge Function `wa-connect`: el alumno vincula un número de WhatsApp a uno de sus agentes (por QR) desde el panel.
// Acciones: start (crear la sesión), status, qr, disconnect. El servidor de WhatsApp (WAHA) solo se habla desde aquí.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { mapStatus, phoneOf, sessionConfig, waha, wahaConfigured } from '../_shared/waha.ts'

const MAX_CONNECTIONS = Number(Deno.env.get('WA_MAX_CONNECTIONS_PER_USER') ?? 2)

class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code) }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  try {
    if (!wahaConfigured() || !Deno.env.get('WA_WEBHOOK_URL') || !Deno.env.get('WA_WEBHOOK_SECRET'))
      throw new HttpError(503, 'whatsapp_not_configured', 'WhatsApp aún no está configurado en el servidor')
    const url = Deno.env.get('SUPABASE_URL')!
    const userDb = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false } })
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const { data: auth } = await userDb.auth.getUser()
    if (!auth?.user) throw new HttpError(401, 'unauthorized')
    const userId = auth.user.id

    const body = JSON.parse((await req.text()) || '{}')
    const action = String(body.action ?? '')

    // La conexión se lee con el token del alumno: la seguridad por filas garantiza que es suya
    const connectionOf = async () => {
      const id = typeof body.connection_id === 'string' ? body.connection_id : ''
      const { data } = await userDb.from('whatsapp_connections').select('*').eq('id', id).maybeSingle()
      if (!data) throw new HttpError(404, 'connection_not_found')
      return data
    }
    const unavailable = () => new HttpError(502, 'whatsapp_unavailable', 'No se pudo contactar con el servidor de WhatsApp. Inténtalo en un momento.')

    if (action === 'start') {
      const agentId = typeof body.agent_id === 'string' ? body.agent_id : ''
      const { data: agent } = await userDb.from('agents').select('id, roadmap_id').eq('id', agentId).maybeSingle()
      if (!agent) throw new HttpError(404, 'agent_not_found')

      const { data: existing } = await userDb.from('whatsapp_connections').select('*').eq('agent_id', agent.id).maybeSingle()
      if (existing) {
        // Ya hay una: si se había parado o fallado, se vuelve a arrancar (genera un QR nuevo)
        if (existing.status === 'failed' || existing.status === 'stopped') {
          await waha(`/api/sessions/${existing.session}/start`, { method: 'POST' }).catch(() => null)
          await admin.from('whatsapp_connections').update({ status: 'starting' }).eq('id', existing.id)
          return json({ connection: { id: existing.id, status: 'starting', phone: existing.phone } })
        }
        return json({ connection: { id: existing.id, status: existing.status, phone: existing.phone } })
      }

      const { count } = await admin.from('whatsapp_connections').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      if ((count ?? 0) >= MAX_CONNECTIONS) throw new HttpError(409, 'connection_limit', `Máximo ${MAX_CONNECTIONS} números por cuenta. Desconecta uno para vincular otro.`)

      const session = `wa_${crypto.randomUUID().replaceAll('-', '')}`
      const { data: row, error } = await admin.from('whatsapp_connections')
        .insert({ user_id: userId, roadmap_id: agent.roadmap_id, agent_id: agent.id, session }).select('id, status, phone').single()
      if (error || !row) throw new HttpError(500, 'db_error', error?.message)
      try {
        const r = await waha('/api/sessions', { body: { name: session, start: true, config: sessionConfig() } })
        if (r.status >= 300) throw new Error(`waha ${r.status}`)
      } catch (e) {
        console.error('[wa-connect] start', e instanceof Error ? e.message : e)
        await admin.from('whatsapp_connections').delete().eq('id', row.id)
        throw unavailable()
      }
      return json({ connection: row })
    }

    if (action === 'status') {
      const c = await connectionOf()
      let r
      try { r = await waha(`/api/sessions/${c.session}`) } catch { throw unavailable() }
      const status = r.status === 404 ? 'stopped' : mapStatus((r.data as { status?: unknown })?.status)
      const phone = phoneOf((r.data as { me?: { id?: unknown } })?.me?.id) ?? c.phone
      if (status !== c.status || phone !== c.phone) await admin.from('whatsapp_connections').update({ status, phone }).eq('id', c.id)
      return json({ status, phone })
    }

    if (action === 'qr') {
      const c = await connectionOf()
      let r
      try { r = await waha(`/api/${c.session}/auth/qr?format=image`) } catch { throw unavailable() }
      const d = r.data as { mimetype?: string; data?: string } | null
      if (r.status !== 200 || !d?.data) return json({ qr: null })
      return json({ qr: `data:${d.mimetype ?? 'image/png'};base64,${d.data}` })
    }

    if (action === 'disconnect') {
      const c = await connectionOf()
      // Primero se cierra la sesión en WhatsApp (el móvil deja de estar vinculado) y se borra del servidor; si falla, igualmente se borra aquí
      await waha(`/api/sessions/${c.session}/logout`, { method: 'POST' }).catch(() => null)
      await waha(`/api/sessions/${c.session}`, { method: 'DELETE' }).catch(() => null)
      await admin.from('whatsapp_connections').delete().eq('id', c.id) // en cascada: conversaciones, mensajes y citas
      return json({ ok: true })
    }

    throw new HttpError(400, 'unknown_action')
  } catch (e) {
    let status = 500, code = 'internal_error', message = 'Error inesperado'
    if (e instanceof HttpError) { status = e.status; code = e.code; message = e.message }
    else if (e instanceof SyntaxError) { status = 400; code = 'invalid_json'; message = 'Petición mal formada' }
    console.error('[wa-connect]', code, e instanceof Error ? e.message : e)
    return json({ error: code, message }, status)
  }
})
