import type { SectionProps } from '@/hooks/useGenerate'
import { eur, impact } from '@/lib/calc'
import type { Metrics, Pricing } from '@/lib/types'

const FIELDS: ReadonlyArray<[keyof Metrics, string, string, number]> = [
  ['leads', 'Consultas nuevas al mes', 'Ej: 60', 100_000],
  ['conversion', '% que se hacen clientes', 'Ej: 20', 100],
  ['ticket', 'Ticket medio por cliente (€)', 'Ej: 65', 1_000_000],
]
const MODES: ReadonlyArray<[NonNullable<Pricing['mode']>, string, string]> = [
  ['aggressive', 'Precio de entrada', 'Para conseguir tus primeros 2-3 clientes rápido. Recomendado si empiezas de cero.'],
  ['premium', 'Precio premium', 'Pocos clientes que pagan más. Para cuando ya tienes resultados que enseñar.'],
]

export default function S3Numbers({ roadmap, update }: SectionProps) {
  const m = roadmap.business_metrics
  const mode = roadmap.pricing_settings.mode ?? 'aggressive'
  const set = (k: keyof Metrics, max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    update({ business_metrics: { ...m, [k]: e.target.value === '' ? undefined : Math.min(max, Math.max(0, Number(e.target.value))) } })
  const ready = (m.leads ?? 0) > 0 && (m.ticket ?? 0) > 0
  const imp = impact(m, roadmap.selected_problems.length)

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {FIELDS.map(([k, label, ph, max]) => (
          <label key={k} className="block text-sm font-semibold">{label}
            <input type="number" min={0} max={max} inputMode="decimal" className="field mt-1.5 font-normal" placeholder={ph} value={m[k] ?? ''} onChange={set(k, max)} />
          </label>
        ))}
      </div>

      {ready && (
        <div className="card space-y-3 p-5">
          <span className="eyebrow">Lo que está en juego</span>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Factura hoy (estimado)" value={`${eur(imp.current)}/mes`} />
            <Stat label="Atendiendo bien cada consulta" value={`${eur(imp.projected)}/mes`} />
            <Stat label="Lo que se le escapa" value={`${eur(imp.extra)}/mes`} hi />
          </div>
          <p className="text-xs text-muted">Estimación conservadora: +{imp.uplift} puntos de conversión por contestar al momento y hacer seguimiento. Este es el argumento central de tu oferta.</p>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold">¿Cómo quieres poner precio a tu oferta?</h3>
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Modo de precios">
          {MODES.map(([id, name, desc]) => (
            <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => update({ pricing_settings: { mode: id } })}
              className={`card p-4 text-left ${mode === id ? '!border-accent-glow bg-accent/10' : ''}`}>
              <span className="block font-bold text-white">{name}</span><span className="text-sm text-muted">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, hi }: { label: string; value: string; hi?: boolean }) {
  return <div className={`rounded-xl border p-3 ${hi ? 'border-accent-glow bg-accent/15' : 'border-line bg-bg-deep/60'}`}><div className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</div><div className="mt-1 text-lg font-bold text-white">{value}</div></div>
}
