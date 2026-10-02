import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import fs from 'node:fs'
const { URL_, ANON, SERVICE, OUT } = process.env
const mk = (k) => createClient(URL_, k, { auth: { persistSession: false }, realtime: { transport: WebSocket } })
const admin = mk(SERVICE), c = mk(ANON)
const email = `prueba-real-${Date.now()}@example.com`, password = 'Prueba-Real-12345'
const { data: u, error: e0 } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Prueba Real' } })
if (e0) throw e0
const result = { steps: [] }
try {
  const { error: e1 } = await c.auth.signInWithPassword({ email, password }); if (e1) throw e1
  const { data: rm, error: e2 } = await c.from('roadmaps').insert({
    project_name: 'Prueba real', user_id: u.user.id, agency_name: 'ClinicaBot',
    selected_problems: ['atencion_leads', 'seguimientos', 'captacion_leads'],
    selected_nichos: ['Clínicas dentales privadas con 2-3 sillones'],
    business_metrics: { leads: 70, conversion: 25, ticket: 450 }, pricing_settings: { mode: 'aggressive' },
    agency_contact: { whatsapp: '34600000000', email: 'hola@clinicabot.es' },
  }).select().single()
  if (e2) throw e2
  for (const kind of ['ideal_client', 'agency_offer', 'agency_site']) {
    const t0 = Date.now()
    const { data, error } = await c.functions.invoke('generate', { body: { kind, roadmap_id: rm.id, params: {} } })
    const secs = +((Date.now() - t0) / 1000).toFixed(1)
    let err = error ? { message: String(error.message).slice(0, 200) } : data?.error ? data : null
    if (error) { try { err = await error.context.json() } catch { /* sin cuerpo */ } }
    result.steps.push({ kind, secs, ok: !err, error: err, credits_left: data?.credits_left })
    console.log(`${kind}: ${err ? 'ERROR ' + JSON.stringify(err) : 'ok'} en ${secs}s`)
    if (err) break
  }
  const { data: row } = await admin.from('roadmaps').select('ideal_client,agency_offer,agency_site').eq('id', rm.id).single()
  const { data: gens } = await admin.from('generations').select('kind,status,credits_cost,model,input_tokens,output_tokens,error,created_at,finished_at').eq('roadmap_id', rm.id).order('created_at')
  result.row = row; result.gens = gens ?? []
  for (const g of gens ?? []) console.log(`  ${g.kind}: ${g.status} · tokens entrada ${g.input_tokens} / salida ${g.output_tokens}${g.error ? ' · ' + g.error : ''}`)
  const { data: prof } = await admin.from('profiles').select('credits').eq('id', u.user.id).single()
  console.log('créditos restantes:', prof?.credits)
} finally {
  await admin.auth.admin.deleteUser(u.user.id)
  console.log('alumno de prueba eliminado de la nube')
  fs.writeFileSync(OUT, JSON.stringify(result, null, 1))
}
