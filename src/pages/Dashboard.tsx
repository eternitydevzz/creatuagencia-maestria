import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bot, Check, Eye, Coins, Gem, Globe, Plus, Rocket, Smartphone, Trophy, UserCheck, type LucideIcon } from 'lucide-react'
import { useGenerationCount, useProfile, useRoadmaps } from '@/hooks/useData'
import { SECTIONS, completedCount, computeXp, isSectionDone, levelFor, stepNo } from '@/lib/gamification'
import { ProgressRing, Skeleton, Spinner, StatusBadge } from '@/components/ui/bits'
import { loadSample } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { useQueryClient } from '@tanstack/react-query'
import NewProjectModal from '@/components/NewProjectModal'
import type { RoadmapSummary } from '@/lib/types'

const GAINS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: UserCheck, title: 'Tu cliente ideal', text: 'Quién es, qué le duele en sus palabras, cuánto pierde y dónde encontrarlo.' },
  { icon: Gem, title: 'Tu oferta', text: 'Promesa, precio anclado en lo que pierde tu cliente, garantía y una oferta piloto.' },
  { icon: Globe, title: 'Tu landing', text: 'Una web de venta premium con tu oferta, lista para descargar y publicar.' },
  { icon: Bot, title: 'Tu agente de WhatsApp', text: 'Una secretaria con IA que atiende, agenda y que enseñas a tus clientes antes de cobrar.' },
]

function Tile({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="card flex items-center gap-3 p-3.5 sm:gap-3.5 sm:p-4">
      <span className="tile-icon h-11 w-11"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
      <div className="min-w-0"><p className="truncate text-xl font-bold leading-none text-white sm:text-2xl">{value}</p><p className="mt-1 text-xs leading-tight text-muted">{label}{hint ? ` · ${hint}` : ''}</p></div>
    </div>
  )
}

/** Los pasos del proyecto como una ruta: hechos, el siguiente y los que faltan. */
function PathStrip({ project, next }: { project: RoadmapSummary; next: number }) {
  return (
    <ol className="mt-7 flex items-center overflow-x-auto pb-1" aria-label="Pasos del proyecto">
      {SECTIONS.map((s, i) => {
        const ok = isSectionDone(project, s.id)
        const isNext = s.id === next
        const Icon = s.icon
        return (
          <li key={s.id} className="flex flex-none items-center">
            <Link to={`/roadmap/${project.id}`} title={`${stepNo(s.id)}. ${s.title}`} aria-label={`${stepNo(s.id)}. ${s.title}${ok ? ' (hecho)' : isNext ? ' (siguiente)' : ''}`}
              className={`grid h-10 w-10 place-items-center rounded-full border-2 transition hover:scale-110 ${ok ? 'border-accent-hi bg-accent-hi text-bg' : isNext ? 'animate-ping-soft border-accent-hi bg-accent text-white' : 'border-white/20 text-muted'}`}>
              {ok ? <Check className="h-4 w-4" strokeWidth={3.5} /> : <Icon className="h-4 w-4" strokeWidth={1.75} />}
            </Link>
            {i < SECTIONS.length - 1 && <span className={`h-0.5 w-5 sm:w-8 ${ok ? 'bg-accent-hi' : 'bg-white/10'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

export default function Dashboard() {
  const { data: profile } = useProfile()
  const { data: roadmaps, isLoading } = useRoadmaps()
  const { data: gens } = useGenerationCount()
  const [creating, setCreating] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)
  const nav = useNavigate(); const toast = useToast(); const qc = useQueryClient()
  const openSample = async () => {
    setLoadingSample(true)
    try { const id = await loadSample(); await qc.invalidateQueries({ queryKey: ['roadmaps'] }); nav(`/roadmap/${id}`) }
    catch (e) { toast(e instanceof Error ? e.message : 'No se pudo cargar el ejemplo.', 'error') } finally { setLoadingSample(false) }
  }
  const first = (profile?.full_name ?? '').split(' ')[0]
  const latest = roadmaps?.[0]
  const xp = computeXp(roadmaps ?? [], gens ?? 0)
  const lvl = levelFor(xp)
  const stepsDone = (roadmaps ?? []).reduce((n, r) => n + completedCount(r), 0)
  const phones = (roadmaps ?? []).filter((r) => r.has_whatsapp).length
  const doneNow = latest ? completedCount(latest) : 0
  const next = latest ? (SECTIONS.find((s) => !isSectionDone(latest, s.id)) ?? SECTIONS[SECTIONS.length - 1]) : SECTIONS[0]
  const finished = !!latest && doneNow === SECTIONS.length

  return (
    <div className="space-y-10">
      <section className="hero-panel relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          {latest ? <ProgressRing value={doneNow / SECTIONS.length} size={116} stroke={9} /> : <img src="/brand/logo-icono.png" alt="" className="h-20 w-20 animate-float rounded-3xl" />}
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Tu centro de control</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-4xl">Bienvenido{first ? `, ${first}` : ''}</h1>
            <p className="mt-2 max-w-xl text-muted">
              {!latest ? 'Crea tu primer proyecto y en unos minutos tendrás tu cliente ideal, tu oferta, tu landing y un agente de WhatsApp listo para enseñar.'
                : finished ? `«${latest.project_name}» está completo. Crea una demo para tu próximo cliente.`
                  : <>Vas por el paso <b className="text-white">{stepNo(next.id)}: {next.title}</b> de «{latest.project_name}».</>}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {latest
              ? <Link to={`/roadmap/${latest.id}`} className="btn px-6 py-3 text-base">{finished ? 'Abrir mi proyecto' : 'Continuar'}<ArrowRight className="h-4 w-4" /></Link>
              : <button className="btn px-6 py-3 text-base" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Crear mi primer proyecto</button>}
            <button type="button" className="btn-ghost px-5 py-3 text-base" onClick={() => void openSample()} disabled={loadingSample} title="Un proyecto terminado de una clínica dental, para ver cómo queda cada paso">{loadingSample ? <Spinner /> : <Eye className="h-4 w-4" />}Ver un ejemplo terminado</button>
          </div>
        </div>
        {latest && <PathStrip project={latest} next={next.id} />}
      </section>

      <section aria-label="Resumen" className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Coins} label="Créditos de IA" value={profile ? String(profile.credits) : '…'} />
        <Tile icon={Trophy} label={`Nivel ${lvl.level}`} value={lvl.name} hint={`${xp} XP`} />
        <Tile icon={Rocket} label="Pasos completados" value={String(stepsDone)} />
        <Tile icon={Smartphone} label="WhatsApp conectados" value={String(phones)} />
      </section>

      <section aria-labelledby="latest">
        <div className="mb-4 flex items-center justify-between"><h2 id="latest" className="text-xl font-bold">Tus proyectos</h2><Link to="/projects" className="text-sm font-semibold text-accent-hi hover:underline">Ver todos →</Link></div>
        {isLoading ? <Skeleton rows={2} /> : !roadmaps?.length ? (
          <div className="card flex flex-col items-center gap-4 p-8 text-center">
            <h3 className="text-xl font-bold">Todavía no tienes proyectos</h3>
            <button className="btn" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Crear proyecto</button>
          </div>
        ) : (
          <div className="stagger grid gap-3 md:grid-cols-2">
            {roadmaps.slice(0, 4).map((r) => {
              const done = completedCount(r)
              return (
                <Link key={r.id} to={`/roadmap/${r.id}`} className="card card-lift flex items-center gap-4 p-4">
                  <ProgressRing value={done / SECTIONS.length} size={56} stroke={6}><span className="text-[11px] font-bold text-white">{done}/{SECTIONS.length}</span></ProgressRing>
                  <div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{r.project_name}</p><p className="truncate text-sm text-muted">{r.selected_nichos[0] ?? 'Sin nicho'}</p></div>
                  <StatusBadge status={r.status} />
                  <ArrowRight className="h-5 w-5 flex-none text-muted" />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="mb-4 text-xl font-bold">Qué te llevas</h2>
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GAINS.map(({ icon: Icon, title, text }, i) => (
            <Link key={title} to={latest ? `/roadmap/${latest.id}` : '/roadmap'} className="card card-lift group space-y-3 p-5">
              <div className="flex items-center justify-between"><span className="tile-hero !h-11 !w-11"><Icon className="h-5 w-5" strokeWidth={1.75} /></span><span className="font-mono text-sm text-muted">0{i + 1}</span></div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{text}</p>
            </Link>
          ))}
        </div>
      </section>
      <NewProjectModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
