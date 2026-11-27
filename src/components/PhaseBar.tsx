import { Check } from 'lucide-react'
import { PHASES, SECTIONS, isSectionDone, phaseOf, phaseProgress, stepNo, type SectionId } from '@/lib/gamification'
import type { Progress } from '@/lib/types'

/** Barra de fases del Mapa de Ruta (sustituye a la columna lateral de 13 pasos): las 4 fases con su avance y,
 *  debajo, los pasos de la fase en la que estás. Pulsar otra fase lleva a su primer paso sin hacer. */
export default function PhaseBar({ progress, current, onGo }: { progress: Progress; current: SectionId; onGo: (id: number) => void }) {
  const active = phaseOf(current)
  const firstPending = (steps: SectionId[]) => steps.find((s) => !isSectionDone(progress, s)) ?? steps[0]

  return (
    <nav aria-label="Pasos del roadmap" className="card mb-6 overflow-hidden">
      <div className="grid grid-cols-2 border-b border-white/10 sm:grid-cols-4">
        {PHASES.map((ph, i) => {
          const { done, total } = phaseProgress(progress, ph)
          const on = ph.id === active.id
          return (
            <button key={ph.id} type="button" aria-pressed={on} onClick={() => !on && onGo(firstPending(ph.steps))}
              className={`phase-tab ${on ? 'is-active' : ''}`}>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted">0{i + 1}</span>
                <span className="truncate font-semibold">{ph.title}</span>
              </span>
              <span className={`phase-count ${done === total ? 'is-complete' : ''}`}>{done === total ? <Check className="h-3 w-3" strokeWidth={3.5} /> : null}{done}/{total}</span>
              <span aria-hidden className="phase-meter"><span style={{ width: `${(done / total) * 100}%` }} /></span>
            </button>
          )
        })}
      </div>
      <ol className="phase-steps">
        {active.steps.map((id) => {
          const s = SECTIONS.find((x) => x.id === id)!
          const ok = isSectionDone(progress, id)
          const on = id === current
          return (
            <li key={id} className="flex-none">
              <button type="button" onClick={() => onGo(id)} aria-current={on ? 'step' : undefined} data-state={on ? 'active' : ok ? 'done' : 'todo'} className="step !w-auto">
                <span className="step-node" aria-hidden>{ok ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : stepNo(id)}</span>
                <span>{s.title}{ok && <span className="sr-only"> (completada)</span>}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
