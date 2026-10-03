import { ArrowRight, Zap } from 'lucide-react'
import { problemLabel, solutionParts } from '@shared/catalog'
import { Empty } from '@/components/ui/bits'
import { problemIcon } from '@/lib/icons'
import { stepNo } from '@/lib/gamification'
import type { SectionProps } from '@/hooks/useGenerate'
import { Lightbulb } from 'lucide-react'

/** Cada problema elegido, convertido en la solución que el alumno vende: qué incluye y el cambio que consigue. */
export default function S11Solutions({ roadmap }: SectionProps) {
  const ids = roadmap.selected_problems
  const custom = roadmap.custom_problem_descriptions
  if (!ids.length) return <Empty icon={Lightbulb}>Elige al menos un problema en el paso {stepNo(1)}: aquí lo convertimos en la solución que vendes.</Empty>

  return (
    <div className="space-y-5">
      <div className="stagger space-y-5">
        {ids.map((id, i) => {
          const Icon = problemIcon(id)
          const s = solutionParts(id, custom)
          const pain = custom[id]?.description ?? problemLabel(id, custom)
          return (
            <article key={id} className="card card-lift relative overflow-hidden p-5 sm:p-6">
              <span aria-hidden className="pointer-events-none absolute -right-2 -top-6 select-none text-[110px] font-black leading-none text-white/[0.04]">{i + 1}</span>
              <div className="relative flex items-start gap-4">
                <span className="tile-hero !h-12 !w-12"><Icon className="h-6 w-6" strokeWidth={1.75} /></span>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-white">{s.label}</h3>
                  <p className="mt-0.5 text-sm text-muted">Resuelve: {pain}</p>
                </div>
              </div>
              {s.bullets.length > 0 && (
                <ul className="relative mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
                  {s.bullets.map((b) => <li key={b} className="flex gap-2.5 text-[15px] text-text"><span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-accent-hi" />{b}</li>)}
                </ul>
              )}
              {(s.from || s.to) && (
                <div className="relative mt-5 flex items-center gap-3 rounded-xl border-l-[3px] border-accent-hi bg-accent/10 px-4 py-3">
                  <Zap className="h-4 w-4 flex-none text-accent-hi" aria-hidden />
                  <p className="text-[15px] text-white">{s.from ? <>De <q className="not-italic text-muted">{s.from}</q> a <q className="not-italic font-semibold">{s.to}</q></> : s.to}</p>
                </div>
              )}
            </article>
          )
        })}
      </div>
      <p className="flex items-center gap-2 text-sm text-muted"><ArrowRight className="h-4 w-4" />Siguiente: elige tu nicho. Estas soluciones se adaptan a él en tu cliente ideal, tu oferta y tu landing.</p>
    </div>
  )
}
