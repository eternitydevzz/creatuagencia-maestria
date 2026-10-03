import { useEffect, useRef, useState, type ReactNode } from 'react'
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

export function SectionHeader({ icon: Icon, title, subtitle, eyebrow }: { icon: LucideIcon; title: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="hero-panel mb-6 flex items-start gap-4 rounded-2xl border border-white/10 p-5">
      <span className="tile-hero mt-0.5 hidden sm:grid"><Icon className="h-6 w-6" strokeWidth={1.75} /></span>
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p>}
      </div>
    </div>
  )
}

/** Anillo de progreso (0 a 1) con el porcentaje en el centro. */
export function ProgressRing({ value, size = 96, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  const v = Math.min(1, Math.max(0, value))
  return (
    <div className="relative grid flex-none place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${Math.round(v * 100)} % completado`}>
      <svg width={size} height={size} className="-rotate-90">
        <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#4da3ff" /><stop offset="100%" stopColor="#8cc6ff" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.16,1,.3,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children ?? <span className="text-xl font-bold text-white">{Math.round(v * 100)}%</span>}</div>
    </div>
  )
}

/** Marcador de posición mientras cargan los datos: líneas con brillo que recorre. */
export function Skeleton({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Cargando">
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton h-16" style={{ width: `${100 - i * 8}%` }} />)}
    </div>
  )
}

/** Iniciales sobre fondo de marca (sustituye a la foto fija que veían todos los alumnos). */
export function Avatar({ name, className = 'h-9 w-9 text-sm' }: { name?: string | null; className?: string }) {
  const initials = (name ?? '').split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
  return <span aria-hidden className={`grid flex-none place-items-center rounded-full bg-accent font-bold text-white ${className}`}>{initials}</span>
}

export function Empty({ children, icon: Icon = Sparkles }: { children: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-5 py-9 text-center text-sm text-muted">
      <span className="tile-icon grid h-11 w-11 animate-float"><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
      <p className="max-w-md">{children}</p>
    </div>
  )
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

/** Número que se desliza hasta su nuevo valor (se queda quieto si el sistema pide menos movimiento). */
export function AnimatedNumber({ value, format = (n: number) => String(Math.round(n)), ms = 450 }: { value: number; format?: (n: number) => string; ms?: number }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || from.current === value) { from.current = value; setShown(value); return }
    const start = from.current, t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3)
      setShown(start + (value - start) * e)
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = value }
  }, [value, ms])
  return <>{format(shown)}</>
}
