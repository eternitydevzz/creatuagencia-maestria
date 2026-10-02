import { useState } from 'react'
import { Check } from 'lucide-react'
import { Spinner } from '@/components/ui/bits'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'

interface Suggestion { nombre: string; oportunidad: string; problema_principal: string; presupuesto_promedio: string }

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
    <div className="space-y-8">
      <label className="block text-sm font-semibold">Nombre de tu agencia
        <input className="field mt-1.5 font-normal" placeholder="Ej: FitIA" maxLength={80} value={roadmap.agency_name ?? ''}
          onChange={(e) => update({ agency_name: e.target.value || null })} />
        <span className="mt-1 block text-xs font-normal text-muted">Aparecerá en tu oferta y en tu landing.</span>
      </label>

      <div>
        <label htmlFor="niche" className="block text-sm font-semibold">Tu nicho</label>
        <input id="niche" className="field mt-1.5" placeholder="Ej: Gimnasios boutique de 150-400 socios" value={input} maxLength={200}
          onChange={(e) => setInput(e.target.value)} onBlur={() => choose(input)} onKeyDown={(e) => { if (e.key === 'Enter') choose(input) }} />
        <p className="mt-1.5 text-xs text-muted">Bien: "clínicas dentales con 2-3 sillones". Mal: "salud".</p>
        {niche && <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent-glow/40 bg-accent/10 px-3 py-1.5 text-sm text-white"><Check className="h-4 w-4 text-accent-glow" />Nicho elegido: <strong>{niche}</strong></p>}
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><span className="eyebrow">¿No lo tienes claro?</span><p className="mt-1 text-sm text-muted">La IA te propone 3 nichos a partir de los problemas que resuelves.</p></div>
          <button type="button" className="btn-ghost" onClick={() => void suggest()} disabled={isBusy('new_niches')}>
            {isBusy('new_niches') ? <><Spinner />Buscando…</> : 'Sugerir nichos (1 crédito)'}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {suggestions.map((s) => (
              <button key={s.nombre} type="button" onClick={() => choose(s.nombre)} aria-pressed={niche === s.nombre}
                className={`card p-4 text-left hover:border-line-strong ${niche === s.nombre ? '!border-accent-glow' : ''}`}>
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
