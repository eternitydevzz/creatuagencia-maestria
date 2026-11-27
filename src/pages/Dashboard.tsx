import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Bot, Check, Clapperboard, Eye, Coins, Gem, Globe, Megaphone, Plus, Rocket, Smartphone, Trophy, UserCheck, type LucideIcon } from 'lucide-react'
import { useGenerationCount, useProfile, useRoadmaps } from '@/hooks/useData'
import { PHASES, SECTIONS, completedCount, computeXp, isSectionDone, levelFor, phaseOf, phaseProgress, stepNo, type SectionId } from '@/lib/gamification'
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
  { icon: Clapperboard, title: 'Tu contenido', text: '5 reels listos para grabar, tu bio de Instagram y 3 carruseles para que los dueños de tu nicho te escriban.' },
  { icon: Megaphone, title: 'Tus anuncios', text: '3 anuncios cortos para Facebook e Instagram y el público al que enseñarlos.' },
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

/** El avance del proyecto por fases (las mismas 4 de la barra del Mapa de Ruta); la fase del siguiente paso, destacada. */
function PathStrip({ project, next }: { project: RoadmapSummary; next: number }) {
  const current = phaseOf(next as SectionId).id
  return (
    <ol className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Fases del proyecto">
      {PHASES.map((ph, i) => {
        const { done, total } = phaseProgress(project, ph)
        const complete = done === total
        const on = ph.id === current && !complete
        return (
          <li key={ph.id}>
            <Link to={`/roadmap/${project.id}`} aria-label={`${ph.title}: ${done} de ${total}${on ? ' (estás aquí)' : ''}`}
              className={`card-lift block rounded-xl border p-3.5 ${on ? 'border-accent-hi/60 bg-accent/[0.12]' : 'border-white/10 bg-white/[0.02]'}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
                <span className={`flex items-center gap-1 font-mono text-[11px] ${complete ? 'text-accent-glow' : 'text-muted'}`}>{complete && <Check className="h-3 w-3" strokeWidth={3.5} />}{done}/{total}</span>
              </span>
              <span className="mt-1 block font-semibold text-white">{ph.title}</span>
              <span aria-hidden className="mt-2.5 block h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-accent to-accent-glow" style={{ width: `${(done / total) * 100}%` }} /></span>
            </Link>
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
              {!latest ? 'Crea tu primer proyecto y en unos minutos tendrás tu cliente ideal, tu oferta, tu landing, tu primer contenido, tus anuncios y un agente de WhatsApp listo para enseñar.'
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
                <Link key={r.id} to={`/roadmap/${r.id}`} className="card card-lift flex min-w-0 items-center gap-4 p-4">
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
        <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
