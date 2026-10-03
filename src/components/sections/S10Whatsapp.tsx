import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarCheck, ChevronDown, Link2Off, MessageSquare, PauseCircle, Phone, Send, Smartphone, Sparkles } from 'lucide-react'
import { Avatar, Empty, Skeleton, Spinner } from '@/components/ui/bits'
import { fetchMessages, useAgent, useBookings, useConnections, useConversations, useDemos, usePreviews } from '@/hooks/useData'
import type { SectionProps } from '@/hooks/useGenerate'
import { useToast } from '@/hooks/useToast'
import { GenerationError, waConnect } from '@/lib/api'
import { play } from '@/lib/sound'
import type { Agent, Booking, WaConnection, WaConversation, WaMessage } from '@/lib/types'
import { stepNo } from '@/lib/gamification'

const when = (iso: string) => new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (m < 1) return 'ahora mismo'
  if (m < 60) return `hace ${m} min`
  if (m < 1440) return `hace ${Math.round(m / 60)} h`
  return `hace ${Math.round(m / 1440)} d`
}

/** "viernes a las 10:00" → { day: 'Viernes', time: '10:00' } (el agente escribe el día y la hora en texto libre). */
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
export function parseWhen(text: string | null): { day?: string; time?: string } {
  if (!text) return {}
  const day = text.match(/\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|hoy|ma[ñn]ana)\b/i)?.[1]
  const t = text.match(/\b(\d{1,2})\s*[:.h]\s*(\d{2})\b/) ?? text.match(/\ba las (\d{1,2})\b/i)
  const date = text.match(new RegExp(`\\b(\\d{1,2})\\s*(?:de\\s+)?(${MONTHS.join('|')})\\b`, 'i')) // "14 de octubre" → "14 oct" cuando no hay hora
  const time = t ? `${t[1].padStart(2, '0')}:${t[2] ?? '00'}` : date ? `${date[1]} ${date[2].slice(0, 3).toLowerCase()}` : undefined
  return { day: day ? day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() : undefined, time }
}

/** Reproduce un sonido cuando un valor numérico sube (p. ej. llega una cita nueva); no suena en la primera carga. */
function useRiseSound(value: number, sound: 'chime' | 'success') {
  const prev = useRef<number | null>(null)
  useEffect(() => { if (prev.current !== null && value > prev.current) play(sound); prev.current = value }, [value, sound])
}

export default function S10Whatsapp({ roadmap, refresh }: SectionProps) {
  const qc = useQueryClient()
  const { data: niche, isLoading: l1 } = useAgent(roadmap.id)
  const { data: demos, isLoading: l2 } = useDemos(roadmap.id)
  const { data: conns, isLoading: l3 } = useConnections(roadmap.id)
  const ids = (conns ?? []).map((c) => c.id)
  const { data: bookings } = useBookings(ids)
  const { data: convs } = useConversations(ids)
  const { data: previews } = usePreviews((convs ?? []).map((c) => c.id))
  const changed = async () => { await qc.invalidateQueries({ queryKey: ['wa-connections', roadmap.id] }); await refresh() }
  const working = (conns ?? []).filter((c) => c.status === 'working').length
  useRiseSound(bookings?.length ?? 0, 'chime')
  useRiseSound(working, 'success')

  if (l1 || l2 || l3) return <Skeleton rows={3} />
  const agents = [niche, ...(demos ?? [])].filter((a): a is Agent => !!a)
  if (!agents.length) return <Empty icon={Smartphone}>Primero crea tu agente (paso {stepNo(7)}) o una demo para un cliente (paso {stepNo(9)}): aquí le conectas un número de WhatsApp.</Empty>

  const today = new Date().toISOString().slice(0, 10)
  const repliesToday = (conns ?? []).reduce((n, c) => n + (c.replies_day === today ? c.replies_today : 0), 0)

  return (
    <div className="space-y-6">
      <div role="note" className="flex items-start gap-3 rounded-xl border border-[#e8b93a]/40 bg-[#e8b93a]/10 px-4 py-3 text-sm text-[#f5d27a]">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
        <div className="space-y-1">
          <p className="font-semibold">Función en beta: usa un número dedicado, no tu WhatsApp personal.</p>
          <p>La vinculación por QR no es la vía oficial de Meta y, aunque el agente solo responde a quien le escribe (nunca inicia conversaciones ni envía mensajes masivos), WhatsApp puede bloquear el número. Puedes desvincularlo cuando quieras. Las conversaciones se guardan 30 días para que las veas aquí; avisa a tu cliente.</p>
        </div>
      </div>

      <div className="stagger space-y-3">
        {agents.map((a) => <AgentRow key={a.id} agent={a} conn={conns?.find((c) => c.agent_id === a.id)} onChanged={changed} />)}
      </div>

      {ids.length > 0 && (
        <>
          <div className="stagger grid grid-cols-3 gap-3">
            <Stat icon={CalendarCheck} value={bookings?.length ?? 0} label="Citas" />
            <Stat icon={MessageSquare} value={convs?.length ?? 0} label="Conversaciones" />
            <Stat icon={Send} value={repliesToday} label="Respuestas hoy" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
            <section aria-label="Citas recibidas">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><CalendarCheck className="h-5 w-5 text-accent-hi" />Citas recibidas</h3>
              <Agenda bookings={bookings ?? []} />
            </section>
            <section aria-label="Conversaciones">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold"><MessageSquare className="h-5 w-5 text-accent-hi" />Conversaciones</h3>
              {convs?.length ? <ul className="stagger space-y-2">{convs.map((c) => <Conversation key={c.id} conv={c} preview={previews?.[c.id]} />)}</ul>
                : <Empty icon={MessageSquare}>Cuando alguien escriba al número, la conversación aparecerá aquí.</Empty>}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

function Stat({ icon: Icon, value, label }: { icon: typeof Sparkles; value: number; label: string }) {
  return (
    <div className="card flex items-center gap-3 p-3.5">
      <span className="tile-icon grid h-10 w-10"><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /></span>
      <div><p className="text-2xl font-bold leading-none text-white">{value}</p><p className="mt-1 text-xs text-muted">{label}</p></div>
    </div>
  )
}

/** Las citas agrupadas por cuándo llegaron: hoy, ayer y antes. */
function Agenda({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) return <Empty icon={CalendarCheck}>Aún no hay citas. Cuando el agente cierre una con un cliente, aparecerá aquí con su día y su hora.</Empty>
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const t0 = startOfDay(new Date())
  const groups: Array<[string, Booking[]]> = [['Hoy', []], ['Ayer', []], ['Antes', []]]
  for (const b of bookings) {
    const t = startOfDay(new Date(b.created_at))
    groups[t >= t0 ? 0 : t >= t0 - 86_400_000 ? 1 : 2][1].push(b)
  }
  return (
    <div className="space-y-5">
      {groups.filter(([, l]) => l.length).map(([label, list]) => (
        <div key={label}>
          <p className="eyebrow mb-2 px-1">{label} · {list.length}</p>
          <ul className="stagger space-y-2.5">{list.map((b) => <BookingCard key={b.id} b={b} />)}</ul>
        </div>
      ))}
    </div>
  )
}

function BookingCard({ b }: { b: Booking }) {
  const { day, time } = parseWhen(b.when_text)
  const fresh = Date.now() - new Date(b.created_at).getTime() < 24 * 3_600_000
  const digits = (b.phone ?? '').replace(/\D/g, '')
  return (
    <li className="card card-lift flex gap-4 p-3.5">
      <div className="grid w-[86px] flex-none place-items-center rounded-2xl py-3 text-center text-white" style={{ background: 'linear-gradient(145deg, #0a7cff, #0b3fa8)', boxShadow: '0 8px 20px rgba(0,112,248,.35), inset 0 1px 0 rgba(255,255,255,.25)' }}>
        {day || time ? (
          <>
            <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-85">{day ?? 'Cita'}</span>
            <span className="text-[26px] font-bold leading-none tracking-tight">{time ?? '—'}</span>
          </>
        ) : <CalendarCheck className="h-7 w-7" strokeWidth={1.75} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold leading-snug text-white">{b.service ?? 'Cita'}</p>
          {fresh && <span className="pill !border-[#00a884]/50 !bg-[#00a884]/15 !py-0.5 !text-[#7fe7cd]"><Sparkles className="h-3 w-3" />Nueva</span>}
        </div>
        {b.when_text && !(day && time) && <p className="text-sm text-text">{b.when_text}</p>}
        <div className="mt-1.5 flex items-center gap-2 text-sm text-muted">
          {b.name && <><Avatar name={b.name} className="h-6 w-6 text-[10px]" /><span className="truncate text-text">{b.name}</span></>}
          <span className="text-xs">· {ago(b.created_at)}</span>
        </div>
        {b.notes && <p className="mt-1 text-xs text-muted">{b.notes}</p>}
        {b.phone && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="btn-ghost !px-3 !py-1.5 !text-xs"><Phone className="h-3.5 w-3.5" />{b.phone}</a>
            {digits.length >= 10 && <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="btn-ghost !px-3 !py-1.5 !text-xs"><MessageSquare className="h-3.5 w-3.5" />Escribirle</a>}
          </div>
        )}
      </div>
    </li>
  )
}

function AgentRow({ agent, conn, onChanged }: { agent: Agent; conn?: WaConnection; onChanged: () => Promise<void> }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const fail = (e: unknown) => toast(e instanceof GenerationError ? e.message : 'Algo ha fallado. Inténtalo de nuevo.', 'error')
  const start = async () => { setBusy(true); try { await waConnect({ action: 'start', agent_id: agent.id }); await onChanged() } catch (e) { fail(e) } finally { setBusy(false) } }
  const stop = async () => {
    if (!conn || !window.confirm('¿Desvincular este número? El agente dejará de contestar y se borrarán sus conversaciones y citas.')) return
    setBusy(true); try { await waConnect({ action: 'disconnect', connection_id: conn.id }); await onChanged() } catch (e) { fail(e) } finally { setBusy(false) }
  }
  const pending = conn && (conn.status === 'starting' || conn.status === 'scan_qr')

  return (
    <div className={`card p-4 ${conn?.status === 'working' ? '!border-[#00a884]/50 shadow-[0_0_30px_rgba(0,168,132,.12)]' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative">
          <Avatar name={agent.config.secretaria.nombre} className="h-11 w-11 text-base" />
          {conn?.status === 'working' && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-bg bg-[#00a884]" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{agent.business_name}</p>
          <p className="truncate text-xs text-muted">{agent.source === 'niche' ? 'Tu agente de ejemplo' : 'Demo de cliente'} · {agent.config.secretaria.nombre}</p>
        </div>
        {!conn && <button type="button" className="btn" onClick={() => void start()} disabled={busy}>{busy ? <Spinner /> : <Smartphone className="h-4 w-4" />}Vincular WhatsApp</button>}
        {conn?.status === 'working' && (
          <>
            <span className="pill !border-[#00a884]/50 !bg-[#00a884]/10 !text-[#7fe7cd]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#00a884]" />Conectado{conn.phone ? ` · ${conn.phone}` : ''}</span>
            <button type="button" className="btn-ghost" onClick={() => void stop()} disabled={busy}><Link2Off className="h-4 w-4" />Desvincular</button>
          </>
        )}
        {conn && (conn.status === 'failed' || conn.status === 'stopped') && (
          <>
            <span className="pill !border-[#ff8f8f]/50 !text-[#ffb3b3]">Desconectado</span>
            <button type="button" className="btn" onClick={() => void start()} disabled={busy}>{busy ? <Spinner /> : null}Reconectar</button>
            <button type="button" className="btn-ghost" onClick={() => void stop()} disabled={busy}><Link2Off className="h-4 w-4" />Quitar</button>
          </>
        )}
      </div>
      {conn?.status === 'working' && <p className="mt-3 text-xs text-muted">Si contestas tú desde el móvil en una conversación, el agente se calla unas horas en ella.</p>}
      {pending && <QrPanel conn={conn} onChanged={onChanged} onCancel={() => void stop()} />}
    </div>
  )
}

/** Muestra el QR y espera a que el alumno lo escanee (el estado se consulta cada pocos segundos). */
function QrPanel({ conn, onChanged, onCancel }: { conn: WaConnection; onChanged: () => Promise<void>; onCancel: () => void }) {
  const [qr, setQr] = useState<string | null>(null)
  const changed = useRef(onChanged) // el padre crea la función en cada render: se guarda en una ref para no reiniciar la consulta
  changed.current = onChanged
  useEffect(() => {
    let alive = true
    const tick = async (n: number) => {
      try {
        const st = await waConnect<{ status: string }>({ action: 'status', connection_id: conn.id })
        if (!alive) return
        if (st.status !== conn.status) { await changed.current(); return }
        if (st.status === 'scan_qr' && n % 3 === 0) { const r = await waConnect<{ qr: string | null }>({ action: 'qr', connection_id: conn.id }); if (alive) setQr(r.qr) }
      } catch { /* se reintenta en el siguiente ciclo */ }
    }
    let n = 0
    void tick(n++)
    const t = setInterval(() => void tick(n++), 3500)
    return () => { alive = false; clearInterval(t) }
  }, [conn.id, conn.status])

  return (
    <div className="mt-4 grid gap-5 border-t border-white/10 pt-4 sm:grid-cols-[220px_1fr] sm:items-center">
      <div className="grid aspect-square w-[220px] max-w-full animate-pop-in place-items-center rounded-2xl bg-white p-3 shadow-[0_0_40px_rgba(77,163,255,.25)]">
        {qr ? <img src={qr} alt="Código QR para vincular WhatsApp" className="h-full w-full [image-rendering:pixelated]" /> : <Spinner className="h-8 w-8 text-bg" />}
      </div>
      <div className="space-y-3 text-sm text-text">
        <p className="text-base font-semibold text-white">Escanéalo con el móvil del número que quieres usar</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-muted">
          <li>Abre WhatsApp en ese móvil.</li>
          <li>Ve a <b className="text-white">Ajustes → Dispositivos vinculados → Vincular un dispositivo</b>.</li>
          <li>Apunta la cámara a este código. Se renueva solo cada pocos segundos.</li>
        </ol>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}

function Conversation({ conv, preview }: { conv: WaConversation; preview?: WaMessage }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<WaMessage[] | null>(null)
  const paused = !!conv.paused_until && new Date(conv.paused_until) > new Date()
  const toggle = async () => {
    setOpen((o) => !o)
    if (!open) setMsgs(await fetchMessages(conv.id).catch(() => []))
  }
  const who = conv.contact_name || `+${conv.chat_id.split('@')[0]}`
  return (
    <li className="card overflow-hidden">
      <button type="button" onClick={() => void toggle()} aria-expanded={open} className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-white/[0.03]">
        <Avatar name={who} className="h-10 w-10 text-sm" />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2"><span className="truncate font-semibold text-white">{who}</span><span className="flex-none text-[11px] text-muted">{ago(conv.last_message_at)}</span></span>
          <span className="block truncate text-[13px] text-muted">{preview ? `${preview.role === 'user' ? '' : preview.role === 'owner' ? 'Tú: ' : 'Agente: '}${preview.content}` : '…'}</span>
        </span>
        {paused && <span className="pill !py-0.5" title="Contestaste tú desde el móvil: el agente está callado en esta conversación"><PauseCircle className="h-3.5 w-3.5" />Tú</span>}
        <ChevronDown className={`h-4 w-4 flex-none text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="max-h-80 space-y-1.5 overflow-y-auto border-t border-white/10 bg-[#0b141a] px-3.5 py-3 text-[13px]">
          {msgs === null ? <Spinner /> : msgs.map((m) => (
            <p key={m.id} title={when(m.created_at)} className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-2.5 py-1.5 ${m.role === 'user' ? 'bg-[#202c33] text-[#e9edef]' : m.role === 'owner' ? 'ml-auto bg-[#e8b93a]/15 text-[#f5d27a]' : 'ml-auto bg-[#005c4b] text-[#e9edef]'}`}>
              {m.role === 'owner' && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide">Tú</span>}{m.content}
            </p>
          ))}
        </div>
      )}
    </li>
  )
}
