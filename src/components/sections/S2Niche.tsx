import { useState } from 'react'
import { Check, Sparkles, Star } from 'lucide-react'
import { Spinner } from '@/components/ui/bits'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'

interface Suggestion { nombre: string; oportunidad: string; problema_principal: string; presupuesto_promedio: string }

// Nichos con dinero, que pagan y a los que es sencillo venderles. Los tres primeros son los que mejor funcionan para empezar.
const IDEAS: Array<[string, boolean]> = [
  ['Clínicas dentales', true], ['Inmobiliarias', true], ['Clínicas estéticas', true], ['Constructoras', false], ['Fisioterapia', false],
  ['Gimnasios boutique', false], ['Talleres mecánicos', false], ['Despachos de abogados', false], ['Veterinarias', false], ['Peluquerías', false],
]

export default function S2Niche({ roadmap, update, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const [input, setInput] = useState(roadmap.selected_nichos[0] ?? '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const niche = roadmap.selected_nichos[0]

  const choose = (name: string) => {
    const n = name.trim()
    setInput(n)
    if (n.length >= 2 && n !== niche) update({ selected_nichos: [n] })
  }
  const suggest = async () => {
    const res = await run<Suggestion[]>('new_niches', {}, { refresh: false, silent: true })
    if (res && Array.isArray(res.parsed)) setSuggestions(res.parsed)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-2 p-5">
        <label htmlFor="agency" className="block text-sm font-semibold">Nombre de tu agencia</label>
        <input id="agency" className="field !py-3 !text-lg" placeholder="Ej: FitIA" maxLength={80} value={roadmap.agency_name ?? ''} onChange={(e) => update({ agency_name: e.target.value || null })} />
        <p className="text-xs text-muted">Aparecerá en tu oferta y en tu landing.</p>
      </div>

      <div className="card space-y-4 p-5">
        <div>
          <label htmlFor="niche" className="block text-sm font-semibold">Tu nicho</label>
          <input id="niche" className="field mt-2 !py-3 !text-lg" placeholder="Ej: Clínicas dentales con 2-3 sillones" value={input} maxLength={200}
            onChange={(e) => setInput(e.target.value)} onBlur={() => choose(input)} onKeyDown={(e) => { if (e.key === 'Enter') choose(input) }} />
          <p className="mt-1.5 text-xs text-muted">Cuanto más concreto, mejor. Bien: «clínicas dentales con 2-3 sillones». Mal: «salud».</p>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Star className="h-3.5 w-3.5 text-[#f5c94f]" />Nichos que pagan bien y son fáciles de empezar</p>
          <div className="flex flex-wrap gap-2">
            {IDEAS.map(([name, top]) => (
              <button key={name} type="button" onClick={() => choose(name)} aria-pressed={niche === name}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 ${niche === name ? 'border-accent-hi bg-accent text-white shadow-[0_6px_18px_rgba(0,112,248,.4)]' : 'border-white/15 bg-white/[0.04] text-text hover:border-accent-hi/60'}`}>
                {top && <Star className="h-3 w-3 text-[#f5c94f]" aria-label="recomendado" />}{name}
              </button>
            ))}
          </div>
        </div>

        {niche && <p className="inline-flex animate-pop-in items-center gap-2 rounded-full border border-accent-glow/40 bg-accent/10 px-4 py-2 text-sm text-white"><Check className="h-4 w-4 text-accent-glow" />Nicho elegido: <strong>{niche}</strong></p>}
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><span className="eyebrow">¿No lo tienes claro?</span><p className="mt-1 text-sm text-muted">La IA te propone 3 nichos a partir de los problemas que resuelves.</p></div>
          <button type="button" className="btn-ghost" onClick={() => void suggest()} disabled={isBusy('new_niches')}>
            {isBusy('new_niches') ? <><Spinner />Buscando…</> : <><Sparkles className="h-4 w-4" />Sugerir nichos (1 crédito)</>}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="stagger grid gap-3 md:grid-cols-3">
            {suggestions.map((s) => (
              <button key={s.nombre} type="button" onClick={() => choose(s.nombre)} aria-pressed={niche === s.nombre}
                className={`card card-lift p-4 text-left ${niche === s.nombre ? '!border-accent-hi !bg-accent/10' : ''}`}>
                <h4 className="font-bold text-white">{s.nombre}</h4>
                <p className="mt-1 text-sm text-text">{s.oportunidad}</p>
                <p className="mt-2 text-xs text-muted">Dolor: {s.problema_principal}</p>
                <p className="mt-1 font-mono text-xs text-accent-glow">{s.presupuesto_promedio}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
