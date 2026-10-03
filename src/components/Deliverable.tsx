import { useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { AiButton, Empty } from '@/components/ui/bits'

/** Marco común de los tres entregables (cliente ideal, oferta, landing): requisito previo, botón de generar y resultado. */
export default function Deliverable({ missing, stale, done, busy, cost, label, pending, onGenerate, actions, children }: {
  missing?: string | false
  stale?: string | null
  done: boolean
  busy: boolean
  cost: number
  label: string
  pending: ReactNode
  onGenerate: () => void
  actions?: ReactNode
  children?: ReactNode
}) {
  if (missing) return <Empty>{missing}</Empty>
  return (
    <div className="space-y-5">
      <div className={`card flex flex-wrap items-center justify-between gap-4 p-5 ${done ? '!border-accent/40' : ''}`}>
        <div className="flex min-w-0 items-center gap-3.5">
          <span className={`grid h-11 w-11 flex-none place-items-center rounded-full ${done ? 'bg-accent-hi text-bg shadow-[0_0_20px_rgba(77,163,255,.5)]' : 'border-2 border-dashed border-white/25 text-muted'}`}>{done ? <CheckCircle2 className="h-6 w-6" /> : <Sparkles className="h-5 w-5" />}</span>
          <div className="min-w-0">
            <span className="eyebrow">{done ? 'Listo' : 'Sin generar'}</span>
            <div className="mt-1 text-sm text-muted">{done ? 'Puedes copiarlo, descargarlo o regenerarlo cuando quieras.' : pending}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {done && actions}
          <AiButton onClick={onGenerate} busy={busy} cost={cost}>{done ? 'Regenerar' : label}</AiButton>
        </div>
      </div>
      {done && stale && (
        <div role="status" className="flex animate-pop-in items-start gap-3 rounded-xl border border-[#e8b93a]/40 bg-[#e8b93a]/10 px-4 py-3 text-sm text-[#f5d27a]">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />{stale}
        </div>
      )}
      {done && children}
    </div>
  )
}

/** Tarjeta destacada con las 2-4 ideas clave de un entregable, encima del detalle completo. */
export function Highlights({ items }: { items: Array<[string, string | undefined]> }) {
  const shown = items.filter(([, v]) => v)
  if (!shown.length) return null
  return (
    <div className="stagger grid gap-3 sm:grid-cols-2">
      {shown.map(([k, v]) => (
        <div key={k} className="card-lift relative overflow-hidden rounded-xl border border-accent/30 bg-accent/[0.07] p-4 pl-5">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent-glow to-accent" />
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent-glow">{k}</div>
          <p className="mt-1.5 text-[15px] leading-relaxed text-white">{v}</p>
        </div>
      ))}
    </div>
  )
}

/** Detalle completo plegado: el resumen ya se ve arriba y el detalle se abre a un clic, para no enterrar la página en texto. */
export function Expandable({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-semibold text-white hover:bg-white/[0.03]">
        {open ? 'Ocultar el detalle' : label}
        {open ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
      </button>
      {open && <div className="border-t border-line p-5">{children}</div>}
    </div>
  )
}
