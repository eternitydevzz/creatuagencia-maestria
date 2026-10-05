import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { PROBLEMS, problemLabel, type CustomProblem } from '@shared/catalog'
import { AiButton } from '@/components/ui/bits'
import { problemIcon } from '@/lib/icons'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'

const MAX = 4

export default function S1Problems({ roadmap, update, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const [name, setName] = useState('')
  const selected = roadmap.selected_problems
  const custom = roadmap.custom_problem_descriptions
  // La IA tarda unos segundos: al terminar hay que partir de lo que el alumno tiene marcado ahora, no de lo que había al empezar.
  const latest = useRef({ selected, custom })
  latest.current = { selected, custom }

  const toggle = (id: string) => {
    if (selected.includes(id)) update({ selected_problems: selected.filter((x) => x !== id) })
    else if (selected.length < MAX) update({ selected_problems: [...selected, id] })
  }

  const addCustom = async () => {
    const problemName = name.trim()
    if (problemName.length < 2 || selected.length >= MAX) return
    const res = await run<CustomProblem>('custom_problem', { problemName }, { refresh: false })
    if (!res?.parsed) return
    const id = `custom_${Date.now().toString(36)}`
    const now = latest.current
    if (now.selected.length >= MAX) { await refresh(); return }
    update({ custom_problem_descriptions: { ...now.custom, [id]: { ...res.parsed, description: res.parsed.description ?? problemName } }, selected_problems: [...now.selected, id] })
    setName('')
    await refresh()
  }

  const customIds = Object.keys(custom)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm">
        <div className="flex gap-2" aria-hidden>{Array.from({ length: MAX }, (_, i) => <span key={i} className={`grid h-9 w-9 place-items-center rounded-xl border-2 font-mono text-xs font-bold transition ${i < selected.length ? 'scale-105 border-accent-hi bg-accent text-white shadow-[0_0_16px_rgba(0,112,248,.55)]' : 'border-white/15 text-muted'}`}>{i + 1}</span>)}</div>
        <span className="text-muted"><b className="text-white">{selected.length} de {MAX}</b> problemas elegidos{selected.length === 0 ? ': empieza por los que más duelen a tu cliente' : selected.length >= MAX ? ': ya tienes el máximo' : ''}</span>
      </div>

      <div className="stagger grid gap-3 sm:grid-cols-2">
        {[...PROBLEMS.map((p) => ({ id: p.id, title: p.title, tagline: p.tagline })), ...customIds.map((id) => ({ id, title: problemLabel(id, custom), tagline: custom[id]?.description ?? 'Problema personalizado' }))].map((p) => {
          const on = selected.includes(p.id)
          const locked = !on && selected.length >= MAX
          const isCustom = p.id.startsWith('custom_')
          return (
            <div key={p.id} className="relative">
              <button type="button" onClick={() => toggle(p.id)} disabled={locked} aria-pressed={on}
                className={`card card-lift group relative flex w-full items-center gap-4 p-4 text-left ${isCustom ? 'pr-12' : ''} ${on ? '!border-accent-hi !bg-accent/10 shadow-[0_10px_30px_rgba(0,112,248,.25)]' : ''} ${locked ? 'pointer-events-none opacity-40' : ''}`}>
                <span className={on ? 'tile-hero !h-11 !w-11' : 'tile-icon h-11 w-11'}>{(() => { const I = problemIcon(p.id); return <I className="h-5 w-5" strokeWidth={1.75} /> })()}</span>
                <span className="min-w-0"><span className="block text-sm font-semibold text-white">{p.title}</span><span className="text-xs text-muted">{p.tagline}</span></span>
                {on && <span aria-hidden className="absolute right-3 top-3 grid h-5 w-5 animate-pop-in place-items-center rounded-full bg-accent-hi text-[11px] font-bold text-bg">✓</span>}
              </button>
              {isCustom && (
                <button type="button" aria-label={`Quitar «${p.title}»`} className="absolute bottom-3 right-3 rounded-md p-0.5 text-muted hover:text-white"
                  onClick={() => { const { [p.id]: _drop, ...rest } = custom; update({ custom_problem_descriptions: rest, selected_problems: selected.filter((x) => x !== p.id) }) }}><X className="h-4 w-4" /></button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-8 border-t border-line pt-5">
        <label htmlFor="custom-problem" className="mb-2 block text-sm font-semibold text-text">¿No encuentras tu problema? Añade uno personalizado y la IA lo desarrolla:</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="custom-problem" className="field" placeholder="Ej: Gestión de inventario, reservas online…" value={name} maxLength={120}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void addCustom() }} />
          <AiButton onClick={() => void addCustom()} busy={isBusy('custom_problem')} cost={1} disabled={name.trim().length < 2 || selected.length >= MAX} className="sm:flex-none">Añadir</AiButton>
        </div>
        {selected.length >= MAX && <p className="mt-2 text-xs text-muted">Has alcanzado el máximo de {MAX}. Quita uno para añadir otro.</p>}
      </div>
    </div>
  )
}
