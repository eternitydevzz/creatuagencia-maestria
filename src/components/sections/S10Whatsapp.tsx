import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CalendarCheck, ChevronDown, Link2Off, MessageSquare, PauseCircle, Smartphone } from 'lucide-react'
import { Empty, Spinner } from '@/components/ui/bits'
import { fetchMessages, useAgent, useBookings, useConnections, useConversations, useDemos } from '@/hooks/useData'
import type { SectionProps } from '@/hooks/useGenerate'
import { useToast } from '@/hooks/useToast'
import { GenerationError, waConnect } from '@/lib/api'
import type { Agent, WaConnection, WaConversation, WaMessage } from '@/lib/types'

const hhmm = (iso: string) => new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function S10Whatsapp({ roadmap, refresh }: SectionProps) {
  const qc = useQueryClient()
  const { data: niche, isLoading: l1 } = useAgent(roadmap.id)
  const { data: demos, isLoading: l2 } = useDemos(roadmap.id)
  const { data: conns, isLoading: l3 } = useConnections(roadmap.id)
  const ids = (conns ?? []).map((c) => c.id)
  const { data: bookings } = useBookings(ids)
  const { data: convs } = useConversations(ids)
  const changed = async () => { await qc.invalidateQueries({ queryKey: ['wa-connections', roadmap.id] }); await refresh() }

  if (l1 || l2 || l3) return <div className="grid place-items-center py-10"><Spinner className="h-6 w-6 text-accent-hi" /></div>
  const agents = [niche, ...(demos ?? [])].filter((a): a is Agent => !!a)
  if (!agents.length) return <Empty>Primero crea tu agente (paso 7) o una demo para un cliente (paso 9): aquí le conectas un número de WhatsApp.</Empty>

  return (
    <div className="space-y-5">
      <div role="note" className="flex items-start gap-3 rounded-xl border border-[#e8b93a]/40 bg-[#e8b93a]/10 px-4 py-3 text-sm text-[#f5d27a]">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
        <div className="space-y-1">
          <p className="font-semibold">Función en beta: usa un número dedicado, no tu WhatsApp personal.</p>
          <p>La vinculación por QR no es la vía oficial de Meta y, aunque el agente solo responde a quien le escribe (nunca inicia conversaciones ni envía mensajes masivos), WhatsApp puede bloquear el número. Puedes desvincularlo cuando quieras. Las conversaciones se guardan 30 días para que las veas aquí; avisa a tu cliente.</p>
        </div>
      </div>

      <div className="space-y-3">
        {agents.map((a) => <AgentRow key={a.id} agent={a} conn={conns?.find((c) => c.agent_id === a.id)} onChanged={changed} />)}
      </div>

      {ids.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <p className="eyebrow flex items-center gap-2"><CalendarCheck className="h-3.5 w-3.5" />Citas recibidas</p>
            {bookings?.length ? (
              <ul className="mt-3 divide-y divide-white/10">
                {bookings.map((b) => (
                  <li key={b.id} className="py-2.5 text-sm">
                    <p className="font-semibold text-white">{[b.service, b.when_text].filter(Boolean).join(' · ') || 'Cita'}</p>
                    <p className="text-muted">{[b.name, b.phone].filter(Boolean).join(' · ')} · {hhmm(b.created_at)}</p>
                    {b.notes && <p className="text-xs text-muted">{b.notes}</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-muted">Aún no hay citas. Cuando el agente cierre una con un cliente, aparecerá aquí.</p>}
          </div>
          <div className="card p-5">
            <p className="eyebrow flex items-center gap-2"><MessageSquare className="h-3.5 w-3.5" />Conversaciones</p>
            {convs?.length ? <ul className="mt-3 space-y-2">{convs.map((c) => <Conversation key={c.id} conv={c} />)}</ul>
              : <p className="mt-3 text-sm text-muted">Cuando alguien escriba al número, la conversación aparecerá aquí.</p>}
          </div>
        </div>
      )}
    </div>
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
    <div className={`card p-4 ${conn?.status === 'working' ? '!border-[#00a884]/50' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="tile-icon grid h-10 w-10"><Smartphone className="h-[18px] w-[18px]" strokeWidth={1.75} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{agent.business_name}</p>
          <p className="truncate text-xs text-muted">{agent.source === 'niche' ? 'Tu agente de ejemplo' : 'Demo de cliente'} · {agent.config.secretaria.nombre}</p>
        </div>
        {!conn && <button type="button" className="btn" onClick={() => void start()} disabled={busy}>{busy ? <Spinner /> : <Smartphone className="h-4 w-4" />}Vincular WhatsApp</button>}
        {conn?.status === 'working' && (
          <>
            <span className="pill !border-[#00a884]/50 !bg-[#00a884]/10 !text-[#7fe7cd]"><span className="h-2 w-2 rounded-full bg-[#00a884]" />Conectado{conn.phone ? ` · ${conn.phone}` : ''}</span>
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
      {conn?.status === 'working' && <p className="mt-3 text-xs text-muted">Respuestas de hoy: {conn.replies_day === new Date().toISOString().slice(0, 10) ? conn.replies_today : 0}. Si contestas tú desde el móvil en una conversación, el agente se calla unas horas en ella.</p>}
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
      <div className="grid aspect-square w-[220px] max-w-full place-items-center rounded-2xl bg-white p-3">
        {qr ? <img src={qr} alt="Código QR para vincular WhatsApp" className="h-full w-full [image-rendering:pixelated]" /> : <Spinner className="h-8 w-8 text-bg" />}
      </div>
      <div className="space-y-3 text-sm text-text">
        <p className="font-semibold text-white">Escanéalo con el móvil del número que quieres usar</p>
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

function Conversation({ conv }: { conv: WaConversation }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<WaMessage[] | null>(null)
  const paused = !!conv.paused_until && new Date(conv.paused_until) > new Date()
  const toggle = async () => {
    setOpen((o) => !o)
    if (!open) setMsgs(await fetchMessages(conv.id).catch(() => []))
  }
  const who = conv.contact_name || `+${conv.chat_id.split('@')[0]}`
  return (
    <li className="rounded-xl border border-white/10 bg-black/20">
      <button type="button" onClick={() => void toggle()} aria-expanded={open} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm">
        <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-white">{who}</span><span className="text-xs text-muted">{hhmm(conv.last_message_at)}</span></span>
        {paused && <span className="pill !py-0.5" title="Contestaste tú desde el móvil: el agente está callado en esta conversación"><PauseCircle className="h-3.5 w-3.5" />Tú atiendes</span>}
        <ChevronDown className={`h-4 w-4 flex-none text-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="max-h-72 space-y-1.5 overflow-y-auto border-t border-white/10 px-3.5 py-3 text-[13px]">
          {msgs === null ? <Spinner /> : msgs.map((m) => (
            <p key={m.id} className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-2.5 py-1.5 ${m.role === 'user' ? 'bg-white/10 text-white' : m.role === 'owner' ? 'ml-auto bg-[#e8b93a]/15 text-[#f5d27a]' : 'ml-auto bg-[#005c4b] text-[#e9edef]'}`}>
              {m.role === 'owner' && <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide">Tú</span>}{m.content}
            </p>
          ))}
        </div>
      )}
    </li>
  )
}
