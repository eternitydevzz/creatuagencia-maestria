// Edge Function `admin-students`: alta, baja y gestión de alumnos desde el panel, solo para cuentas con rol admin.
// El rol se comprueba aquí contra la base de datos (nunca se fía de lo que diga el navegador). Las contraseñas temporales se
// generan en el servidor y se devuelven una sola vez; no se guardan en ningún sitio.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { waha } from '../_shared/waha.ts'

class HttpError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code) }
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin caracteres que se confunden (l, 1, I, O, 0)
function tempPassword(len = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const userDb = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false } })
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

    const { data: auth } = await userDb.auth.getUser()
    if (!auth?.user) throw new HttpError(401, 'unauthorized')
    const me = auth.user.id
    const { data: profile } = await admin.from('profiles').select('role').eq('id', me).maybeSingle()
    if (profile?.role !== 'admin') throw new HttpError(403, 'forbidden', 'Solo los administradores pueden gestionar alumnos')

    const raw = await req.text()
    if (raw.length > 10_000) throw new HttpError(413, 'payload_too_large')
    const body = JSON.parse(raw || '{}')
    const action = String(body.action ?? '')

    /** El alumno objetivo: debe existir y no ser administrador ni uno mismo (para no quedarse sin acceso por error). */
    const targetOf = async (id: unknown) => {
      if (typeof id !== 'string' || id.length > 64) throw new HttpError(400, 'invalid_params', 'Alumno inválido')
      if (id === me) throw new HttpError(400, 'is_self', 'No puedes hacer esto con tu propia cuenta')
      const { data } = await admin.from('profiles').select('id, email, role, credits').eq('id', id).maybeSingle()
      if (!data) throw new HttpError(404, 'student_not_found', 'No existe ese alumno')
      if (data.role === 'admin') throw new HttpError(400, 'is_admin', 'Esa cuenta es de administrador')
      return data
    }

    if (action === 'list') {
      const { data: profiles, error } = await admin.from('profiles').select('id, email, full_name, role, credits, created_at').order('created_at', { ascending: false })
      if (error) throw new HttpError(500, 'db_error', error.message)
      const { data: projects } = await admin.from('roadmaps').select('user_id')
      const counts = new Map<string, number>()
      for (const r of projects ?? []) counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1)
      const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const seen = new Map((users?.users ?? []).map((u) => [u.id, u.last_sign_in_at ?? null]))
      return json({ students: (profiles ?? []).map((p) => ({ ...p, projects: counts.get(p.id) ?? 0, last_sign_in_at: seen.get(p.id) ?? null })) })
    }

    if (action === 'create') {
      const email = String(body.email ?? '').trim().toLowerCase()
      const name = String(body.name ?? '').trim().slice(0, 80)
      const credits = Number.isFinite(Number(body.credits)) ? Math.round(Number(body.credits)) : 30
      if (!EMAIL.test(email) || email.length > 200) throw new HttpError(400, 'invalid_email', 'El email no es válido')
      if (credits < 0 || credits > 1000) throw new HttpError(400, 'invalid_credits', 'Los créditos deben estar entre 0 y 1000')
      const password = tempPassword()
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: name ? { full_name: name } : undefined })
      if (error || !data.user) {
        if (/already|registered|exists/i.test(error?.message ?? '')) throw new HttpError(409, 'email_exists', 'Ya existe un alumno con ese email')
        throw new HttpError(500, 'create_failed', error?.message)
      }
      // El alta automática da los créditos iniciales; aquí se ajustan a los que se pidieron
      const { data: p } = await admin.from('profiles').select('credits').eq('id', data.user.id).single()
      const delta = credits - (p?.credits ?? 0)
      if (delta > 0) await admin.rpc('refund_credits', { p_user: data.user.id, p_amount: delta, p_reason: 'admin: créditos del alta' })
      else if (delta < 0) await admin.rpc('spend_credits', { p_user: data.user.id, p_cost: -delta, p_reason: 'admin: ajuste del alta' })
      return json({ student: { id: data.user.id, email, password, credits } })
    }

    if (action === 'grant') {
      const t = await targetOf(body.id)
      const amount = Math.round(Number(body.amount))
      if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1000) throw new HttpError(400, 'invalid_credits', 'La cantidad debe estar entre -1000 y 1000 (y no ser 0)')
      const reason = `admin: ${String(body.reason ?? (amount > 0 ? 'créditos añadidos' : 'créditos retirados')).slice(0, 80)}`
      const { data, error } = amount > 0
        ? await admin.rpc('refund_credits', { p_user: t.id, p_amount: amount, p_reason: reason })
        : await admin.rpc('spend_credits', { p_user: t.id, p_cost: -amount, p_reason: reason })
      if (error) throw new HttpError(/insufficient/.test(error.message) ? 409 : 500, /insufficient/.test(error.message) ? 'insufficient_credits' : 'db_error', /insufficient/.test(error.message) ? 'El alumno no tiene tantos créditos' : error.message)
      return json({ credits: data })
    }

    if (action === 'reset_password') {
      const t = await targetOf(body.id)
      const password = tempPassword()
      const { error } = await admin.auth.admin.updateUserById(t.id, { password })
      if (error) throw new HttpError(500, 'reset_failed', error.message)
      return json({ student: { id: t.id, email: t.email, password } })
    }

    if (action === 'delete') {
      const t = await targetOf(body.id)
      // Si el alumno tenía números de WhatsApp vinculados, se desvinculan en el servidor antes de borrar (si no, la sesión seguiría viva)
      const { data: conns } = await admin.from('whatsapp_connections').select('session').eq('user_id', t.id)
      for (const c of conns ?? []) {
        await waha(`/api/sessions/${c.session}/logout`, { method: 'POST' }).catch(() => null)
        await waha(`/api/sessions/${c.session}`, { method: 'DELETE' }).catch(() => null)
      }
      const { error } = await admin.auth.admin.deleteUser(t.id) // en cascada: perfil, proyectos, agentes, conexiones, conversaciones, citas y movimientos
      if (error) throw new HttpError(500, 'delete_failed', error.message)
      return json({ ok: true })
    }

    throw new HttpError(400, 'unknown_action')
  } catch (e) {
    let status = 500, code = 'internal_error', message = 'Error inesperado'
    if (e instanceof HttpError) { status = e.status; code = e.code; message = e.message }
    else if (e instanceof SyntaxError) { status = 400; code = 'invalid_json'; message = 'Petición mal formada' }
    console.error('[admin-students]', code, e instanceof Error ? e.message : e)
    return json({ error: code, message }, status)
  }
})
