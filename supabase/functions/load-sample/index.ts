// Edge Function `load-sample`: crea en la cuenta del alumno un proyecto de ejemplo ya terminado (clínica dental), para que vea
// cómo queda cada paso sin esperar ni gastar créditos (y para enseñarlo en directo). Los textos son salida real de Claude,
// generada una vez y guardada en _shared/sample.ts. Se crea una sola vez por cuenta; si ya existe, devuelve el mismo.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { inputsSignature } from '../_shared/signature.ts'
import { SAMPLE } from '../_shared/sample.ts'
import { isApproved, NOT_APPROVED_MESSAGE } from '../_shared/approval.ts'

const NAME = 'Ejemplo: Dentia (clínica dental)'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const userDb = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } }, auth: { persistSession: false } })
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
    const { data: auth } = await userDb.auth.getUser()
    if (!auth?.user) return json({ error: 'unauthorized' }, 401)
    const userId = auth.user.id
    if (!(await isApproved(admin, userId))) return json({ error: 'not_approved', message: NOT_APPROVED_MESSAGE }, 403)

    const { data: existing } = await admin.from('roadmaps').select('id').eq('user_id', userId).eq('project_name', NAME).maybeSingle()
    if (existing) return json({ roadmap_id: existing.id, created: false })

    const f = SAMPLE.fields
    const sig = (withAgency: boolean) => inputsSignature({ ...f, custom_problem_descriptions: {} }, withAgency)
    const t = (min: number) => new Date(Date.now() - min * 60_000).toISOString() // fechas coherentes: cliente ideal → oferta → landing → agente
    const [tIdeal, tOffer, tSite, tAgent] = [t(40), t(30), t(20), t(10)]

    const { data: rm, error } = await admin.from('roadmaps').insert({
      user_id: userId, project_name: NAME, status: 'in_progress', ...f, custom_problem_descriptions: {},
      current_section: 4, visited_sections: [1, 11, 2, 3, 4, 5, 6, 7, 8],
      ideal_client: { ...SAMPLE.ideal_client, _meta: { generated_at: tIdeal, inputs: sig(false) } },
      agency_offer: { ...SAMPLE.agency_offer, _meta: { generated_at: tOffer, inputs: sig(true), ideal_at: tIdeal } },
      agency_site: { ...SAMPLE.agency_site, _meta: { generated_at: tSite, inputs: sig(true), offer_at: tOffer } },
    }).select('id').single()
    if (error || !rm) return json({ error: 'db_error', message: error?.message }, 500)

    const { error: aErr } = await admin.from('agents').insert({
      user_id: userId, roadmap_id: rm.id, source: 'niche', business_name: SAMPLE.agent.business_name,
      config: { ...SAMPLE.agent.config, _meta: { generated_at: tAgent, inputs: sig(true), ideal_at: tIdeal, offer_at: tOffer } },
    })
    if (aErr) { await admin.from('roadmaps').delete().eq('id', rm.id); return json({ error: 'db_error', message: aErr.message }, 500) }
    return json({ roadmap_id: rm.id, created: true })
  } catch (e) {
    console.error('[load-sample]', e instanceof Error ? e.message : e)
    return json({ error: 'internal_error', message: 'Error inesperado' }, 500)
  }
})
