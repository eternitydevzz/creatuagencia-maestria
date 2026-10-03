import { Bot, Globe, Megaphone, Package, Phone, RefreshCw, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react'
import { clientsToPayBack, DEFAULTS, LIMITS, priceTable } from '@shared/pricing'
import { AnimatedNumber } from '@/components/ui/bits'
import type { SectionProps } from '@/hooks/useGenerate'
import { eur, impact } from '@/lib/calc'
import type { Metrics, Pricing } from '@/lib/types'

const ICONS: Record<string, LucideIcon> = { landing: Globe, whatsapp: Bot, followup: RefreshCw, voice: Phone, ads: Megaphone }
const MODES: ReadonlyArray<[NonNullable<Pricing['mode']>, string]> = [['aggressive', 'Agresivo'], ['premium', 'Premium']]
const MODE_HINT: Record<NonNullable<Pricing['mode']>, string> = {
  aggressive: 'Precio de entrada para conseguir tus primeros 2-3 clientes rápido. Recomendado si empiezas de cero.',
  premium: 'Precios altos para clientes de calidad. Menos trabajo, más rentabilidad. Para cuando ya tienes resultados que enseñar.',
}

interface SliderProps { label: string; value: number; min: number; max: number; step: number; format: (n: number) => string; onChange: (n: number) => void; minLabel: string; maxLabel: string }

function SliderCard({ label, value, min, max, step, format, onChange, minLabel, maxLabel }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="card card-lift p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight text-white"><AnimatedNumber value={value} format={format} ms={250} /></p>
      <input type="range" className="range mt-5" min={min} max={max} step={step} value={value} aria-label={label} style={{ '--pct': `${pct}%` } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))} />
      <div className="mt-2 flex justify-between font-mono text-[11px] text-muted"><span>{minLabel}</span><span>{maxLabel}</span></div>
    </div>
  )
}

export default function S3Numbers({ roadmap, update }: SectionProps) {
  const m = roadmap.business_metrics
  const mode = roadmap.pricing_settings.mode ?? 'aggressive'
  const saved = (m.leads ?? 0) > 0 && (m.ticket ?? 0) > 0
  const v = { leads: m.leads ?? DEFAULTS.leads, adSpend: m.ad_spend ?? DEFAULTS.adSpend, ticket: m.ticket ?? DEFAULTS.ticket, conversion: m.conversion ?? DEFAULTS.conversion }
  // Al mover cualquier deslizador se guardan los cuatro números (los que no se tocan, con su valor de ejemplo)
  const set = (patch: Partial<Metrics>) => update({ business_metrics: { leads: v.leads, ad_spend: v.adSpend, ticket: v.ticket, conversion: v.conversion, ...patch } })

  const table = priceTable({ leads: v.leads, adSpend: v.adSpend, ticket: v.ticket, mode })
  const imp = impact({ leads: v.leads, conversion: v.conversion, ticket: v.ticket }, roadmap.selected_problems.length)
  const need = clientsToPayBack(table.pack.monthly, v.ticket)
  const n = (x: number) => eur(x)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <p className="max-w-xl text-muted">Cuántas consultas le llegan a un negocio típico de tu nicho, cuánto invierte en anuncios y cuánto vale un cliente. Con eso, el precio sale solo.</p>
        <div className="card w-full flex-none p-3 lg:w-[360px]">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1" role="radiogroup" aria-label="Modo de precios">
            {MODES.map(([id, name]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => update({ pricing_settings: { mode: id } })}
                className={`rounded-lg py-2 text-sm font-semibold transition ${mode === id ? 'bg-gradient-to-b from-[#2b92ff] to-accent text-white shadow-[0_4px_14px_rgba(0,112,248,.45)]' : 'text-muted hover:text-white'}`}>{name}</button>
            ))}
          </div>
          <p className="px-1.5 pb-1 pt-3 text-xs leading-relaxed text-muted">{MODE_HINT[mode]}</p>
        </div>
      </div>

      {!saved && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-text">
          <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent-hi" />Son números de ejemplo. Muévelos a los de tu nicho o úsalos tal cual.</span>
          <button type="button" className="btn !px-4 !py-2" onClick={() => set({})}>Usar estos números</button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SliderCard label="Consultas nuevas por mes" value={v.leads} min={LIMITS.leads[0]} max={LIMITS.leads[1]} step={10} format={(x) => String(Math.round(x))} onChange={(x) => set({ leads: x })} minLabel={String(LIMITS.leads[0])} maxLabel={String(LIMITS.leads[1])} />
        <SliderCard label="Inversión mensual en anuncios" value={v.adSpend} min={LIMITS.adSpend[0]} max={LIMITS.adSpend[1]} step={50} format={n} onChange={(x) => set({ ad_spend: x })} minLabel={n(LIMITS.adSpend[0])} maxLabel={n(LIMITS.adSpend[1])} />
        <SliderCard label="Ticket promedio del cliente" value={v.ticket} min={LIMITS.ticket[0]} max={LIMITS.ticket[1]} step={10} format={n} onChange={(x) => set({ ticket: x })} minLabel={n(LIMITS.ticket[0])} maxLabel={n(LIMITS.ticket[1])} />
      </div>
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="sm:w-64"><p className="text-sm text-muted">De cada 100 consultas, hoy compran</p><p className="text-2xl font-bold text-white"><AnimatedNumber value={v.conversion} format={(x) => `${Math.round(x)} de 100`} ms={200} /></p></div>
        <div className="flex-1"><input type="range" className="range" min={LIMITS.conversion[0]} max={LIMITS.conversion[1]} step={1} value={v.conversion} aria-label="Consultas que acaban comprando" style={{ '--pct': `${((v.conversion - LIMITS.conversion[0]) / (LIMITS.conversion[1] - LIMITS.conversion[0])) * 100}%` } as React.CSSProperties} onChange={(e) => set({ conversion: Number(e.target.value) })} /></div>
      </div>

      <section aria-labelledby="prices">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div><p className="eyebrow">Tu tabla de precios</p><h3 id="prices" className="text-2xl font-bold">Esto es lo que puedes cobrar</h3></div>
          <p className="text-xs text-muted">Guía de mercado calculada con estos números, en euros.</p>
        </div>
        <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {table.lines.map((l) => {
            const Icon = ICONS[l.id] ?? Sparkles
            return (
              <article key={l.id} className="card card-lift flex flex-col p-5">
                <div className="flex items-start gap-3">
                  <span className="tile-icon grid h-10 w-10"><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /></span>
                  <div className="min-w-0"><h4 className="font-semibold leading-snug text-white">{l.name}</h4><p className="mt-0.5 text-sm text-muted">{l.description}</p></div>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <div><p className="font-mono text-[10px] uppercase tracking-widest text-muted">Instalación</p><p className="text-3xl font-bold text-white"><AnimatedNumber value={l.setup} format={n} /></p></div>
                  {l.monthly > 0 && <div className="text-right"><p className="font-mono text-[10px] uppercase tracking-widest text-muted">Al mes</p><p className="text-xl font-semibold text-accent-glow">+ <AnimatedNumber value={l.monthly} format={n} /></p></div>}
                </div>
              </article>
            )
          })}
        </div>

        <article className="relative mt-4 overflow-hidden rounded-2xl border border-accent/50 p-6" style={{ background: 'radial-gradient(ellipse 70% 120% at 100% 0%, rgba(0,112,248,.35), transparent 60%), rgba(255,255,255,.03)' }}>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-start gap-3">
              <span className="tile-hero"><Package className="h-6 w-6" strokeWidth={1.75} /></span>
              <div><p className="eyebrow">Lo que más te conviene vender</p><h4 className="text-xl font-bold text-white">Pack completo</h4><p className="text-sm text-muted">Landing + agente de WhatsApp + seguimiento + anuncios. Un 15 % menos que por separado.</p></div>
            </div>
            <div className="flex items-end gap-6">
              <div><p className="font-mono text-[10px] uppercase tracking-widest text-muted">Instalación</p><p className="text-4xl font-bold text-white"><AnimatedNumber value={table.pack.setup} format={n} /></p></div>
              <div><p className="font-mono text-[10px] uppercase tracking-widest text-muted">Al mes</p><p className="text-2xl font-semibold text-accent-glow">+ <AnimatedNumber value={table.pack.monthly} format={n} /></p></div>
            </div>
          </div>
          <p className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-text"><TrendingUp className="h-4 w-4 flex-none text-accent-hi" />
            Con {need} {need === 1 ? 'cliente más' : 'clientes más'} al mes (ticket de {n(v.ticket)}), tu cliente cubre la cuota mensual. Es el argumento para cobrarlo.</p>
        </article>
      </section>

      <div className="card space-y-3 p-5">
        <p className="eyebrow">Lo que está en juego para tu cliente</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Factura hoy (estimado)" value={`${n(imp.current)}/mes`} />
          <Stat label="Atendiendo bien cada consulta" value={`${n(imp.projected)}/mes`} />
          <Stat label="Lo que se le escapa" value={`${n(imp.extra)}/mes`} hi />
        </div>
        <p className="text-xs text-muted">Estimación conservadora: +{imp.uplift} puntos de conversión por contestar al momento y hacer seguimiento. Este es el argumento central de tu oferta.</p>
      </div>
    </div>
  )
}

function Stat({ label, value, hi }: { label: string; value: string; hi?: boolean }) {
  return <div className={`rounded-xl border p-3 ${hi ? 'border-accent-glow bg-accent/15' : 'border-line bg-bg-deep/60'}`}><div className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</div><div className="mt-1 text-lg font-bold text-white">{value}</div></div>
}
