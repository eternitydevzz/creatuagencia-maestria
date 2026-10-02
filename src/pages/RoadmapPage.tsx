import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Plus } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useRoadmap, useRoadmaps } from '@/hooks/useData'
import type { SectionProps } from '@/hooks/useGenerate'
import { SECTIONS, completedCount, isSectionDone, progressOf, type SectionId } from '@/lib/gamification'
import { SectionHeader, Spinner } from '@/components/ui/bits'
import NewProjectModal from '@/components/NewProjectModal'
import S1Problems from '@/components/sections/S1Problems'
import S2Niche from '@/components/sections/S2Niche'
import S3Numbers from '@/components/sections/S3Numbers'
import S4IdealClient from '@/components/sections/S4IdealClient'
import S5Offer from '@/components/sections/S5Offer'
import S6Landing from '@/components/sections/S6Landing'

// Tipado con SectionId: si se añade un paso a SECTIONS y falta su pantalla aquí, no compila.
const VIEWS: Record<SectionId, ComponentType<SectionProps>> = { 1: S1Problems, 2: S2Niche, 3: S3Numbers, 4: S4IdealClient, 5: S5Offer, 6: S6Landing }

function Center({ children }: { children: React.ReactNode }) { return <div className="grid min-h-[60vh] place-items-center">{children}</div> }

export default function RoadmapPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data: list, isLoading: listLoading } = useRoadmaps()
  const [creating, setCreating] = useState(false)

  // /roadmap sin id: abre el último proyecto o invita a crear uno
  if (!id) {
    if (listLoading) return <Center><Spinner className="h-8 w-8 text-accent-hi" /></Center>
    if (list?.length) return <Navigate to={`/roadmap/${list[0].id}`} replace />
    return (
      <Center>
        <div className="card max-w-md space-y-4 p-8 text-center">
          <img src="/brand/logo-icono.png" alt="" className="mx-auto h-16 w-16 rounded-2xl" />
          <h1 className="text-2xl font-bold">Crea tu primer Roadmap</h1>
          <p className="text-muted">Tu mapa de ruta completo para lanzar tu agencia de automatización con IA.</p>
          <button className="btn" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Crear proyecto</button>
        </div>
        <NewProjectModal open={creating} onClose={() => setCreating(false)} />
      </Center>
    )
  }
  return <Editor key={id} id={id} onMissing={() => nav('/projects', { replace: true })} />
}

function Editor({ id, onMissing }: { id: string; onMissing: () => void }) {
  const { roadmap, loading, saving, saveFailed, update, refresh } = useRoadmap(id)
  const [section, setSection] = useState<number | null>(null)
  const doneCount = useRef<number | null>(null)
  const top = useRef<HTMLDivElement>(null)

  // current_section viene de la base de datos: se acota por si el mapa tiene menos pasos que cuando se guardó
  useEffect(() => { if (roadmap && section === null) setSection(Math.min(SECTIONS.length, Math.max(1, roadmap.current_section))) }, [roadmap, section])
  useEffect(() => { if (!loading && !roadmap) onMissing() }, [loading, roadmap, onMissing])

  const done = roadmap ? completedCount(progressOf(roadmap)) : 0
  useEffect(() => {
    if (!roadmap) return
    if (doneCount.current !== null && done > doneCount.current) {
      confetti({ particleCount: done === SECTIONS.length ? 140 : 60, spread: 80, origin: { y: 0.3 }, colors: ['#0070f8', '#4da3ff', '#ffffff', '#d00008'], disableForReducedMotion: true })
      if (done === SECTIONS.length && roadmap.status !== 'completed') update({ status: 'completed' })
    }
    doneCount.current = done
  }, [done, roadmap, update])

  if (loading || !roadmap || section === null) return <Center><Spinner className="h-8 w-8 text-accent-hi" /></Center>

  const go = (n: number) => {
    const target = Math.min(SECTIONS.length, Math.max(1, n))
    setSection(target)
    update({
      current_section: target,
      visited_sections: Array.from(new Set([...roadmap.visited_sections, target])),
      ...(roadmap.status === 'draft' ? { status: 'in_progress' as const } : {}),
    })
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const progress = progressOf(roadmap)
  const pct = Math.round((done / SECTIONS.length) * 100)
  const current = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]
  const View = VIEWS[current.id]
  const props: SectionProps = { roadmap, update, refresh }

  return (
    <div ref={top} className="scroll-mt-24">
      {/* Barra del proyecto, a todo el ancho */}
      <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-white/10 pb-4">
        <img src="/brand/logo-icono.png" alt="" className="h-9 w-9 rounded-lg" />
        <div className="min-w-0"><p className="truncate text-base font-bold text-white">{roadmap.project_name}</p><p className={`text-xs ${saveFailed ? 'text-[#ffb3b3]' : 'text-muted'}`}>{saveFailed ? 'No se pudo guardar. Reintentando…' : saving ? 'Guardando…' : 'Guardado automáticamente'}</p></div>
        <div className="ml-auto flex w-full items-center gap-3 sm:w-96">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del roadmap">
            <div className="h-full rounded-full bg-accent-hi transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-10 text-right text-sm font-bold text-white">{pct}%</span>
          <span className="w-14 text-right font-mono text-xs text-muted">{done} de {SECTIONS.length}</span>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav aria-label="Secciones del roadmap" className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-28 lg:w-64 lg:flex-none lg:flex-col lg:gap-1 lg:overflow-visible">
          <p className="eyebrow mb-2 hidden px-3 lg:block">Secciones</p>
          {SECTIONS.map((s) => {
            const active = s.id === current.id
            const ok = isSectionDone(progress, s.id)
            const Icon = s.icon
            return (
              <button key={s.id} type="button" onClick={() => go(s.id)} aria-current={active ? 'step' : undefined} className="nav-item">
                <span className="tile-icon-sm relative"><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  {ok && <span aria-hidden className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-accent-hi text-bg"><Check className="h-2 w-2" strokeWidth={4} /></span>}
                </span>
                <span>{s.title}{ok && <span className="sr-only"> (completada)</span>}</span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 flex-1">
          <div key={current.id} className="section-shell animate-step-in">
            <SectionHeader icon={current.icon} title={current.heading} subtitle={current.description} />
            <View {...props} />
          </div>
          <div className="mt-6 flex justify-between gap-3">
            <button className="btn-ghost" onClick={() => go(section - 1)} disabled={section === 1}><ArrowLeft className="h-4 w-4" />Anterior</button>
            {section < SECTIONS.length ? <button className="btn-ghost" onClick={() => go(section + 1)}>Siguiente<ArrowRight className="h-4 w-4" /></button> : <span className="pill">Has llegado al final del mapa 🎉</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
