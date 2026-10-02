import { useState, type ReactNode } from 'react'
import { Check, Copy, Loader2, Sparkles, type LucideIcon } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) { return <Loader2 className={`${className} animate-spin`} aria-hidden /> }

export function CopyButton({ text, label = 'Copiar', className = '' }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false)
  const toast = useToast()
  return (
    <button type="button" className={`btn-ghost ${className}`} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); toast('Copiado al portapapeles'); setTimeout(() => setDone(false), 1800) }
      catch { toast('No se pudo copiar. Selecciona el texto manualmente.', 'error') }
    }}>
      {done ? <Check className="h-4 w-4 text-accent-hi" /> : <Copy className="h-4 w-4" />}{done ? 'Copiado' : label}
    </button>
  )
}

/** Botón que dispara una generación con IA y muestra su coste en créditos. */
export function AiButton({ onClick, busy, cost, children, disabled, className = '' }: {
  onClick: () => void; busy: boolean; cost: number; children: ReactNode; disabled?: boolean; className?: string
}) {
  return (
    <button type="button" className={`btn whitespace-nowrap ${className}`} onClick={onClick} disabled={busy || disabled}>
      {busy ? <Spinner /> : <Sparkles className="h-4 w-4" />}
      <span>{busy ? 'Generando con IA…' : children}</span>
      {!busy && <span className="rounded-md bg-black/25 px-1.5 py-0.5 font-mono text-[11px] font-medium opacity-90">{cost} {cost === 1 ? 'crédito' : 'créditos'}</span>}
    </button>
  )
}

export function SectionHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-3.5 border-b border-white/10 pb-5">
      <span className="tile-icon mt-0.5 hidden sm:grid"><Icon className="h-5 w-5" /></span>
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted sm:text-base">{subtitle}</p>}
      </div>
    </div>
  )
}

/** Iniciales sobre fondo de marca (sustituye a la foto fija que veían todos los alumnos). */
export function Avatar({ name, className = 'h-9 w-9 text-sm' }: { name?: string | null; className?: string }) {
  const initials = (name ?? '').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  return <span aria-hidden className={`grid flex-none place-items-center rounded-full bg-accent font-bold text-white ${className}`}>{initials}</span>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">{children}</div>
}

const STATUS = {
  draft: { label: 'Borrador', cls: 'border-line text-muted bg-white/5' },
  in_progress: { label: 'En progreso', cls: 'border-[#e8b93a]/40 text-[#f5c94f] bg-[#e8b93a]/10' },
  completed: { label: 'Completado', cls: 'border-accent-glow/60 text-accent-glow bg-accent/20' },
} as const
export function StatusBadge({ status }: { status: keyof typeof STATUS }) {
  const s = STATUS[status] ?? STATUS.draft
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
}
