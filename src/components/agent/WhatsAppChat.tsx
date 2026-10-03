import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, Lock, RotateCcw, Send } from 'lucide-react'
import { chatWithAgent, GenerationError, type ChatBooking, type ChatTurn } from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { play } from '@/lib/sound'
import type { Agent } from '@/lib/types'

interface Bubble { id: number; from: 'me' | 'bot' | 'booking'; text: string; at: Date; booking?: ChatBooking }

// El servidor acepta 40 mensajes por conversación; con las respuestas de la secretaria, unos 18 del usuario
const MAX_USER_MESSAGES = 18
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const hhmm = (d: Date) => d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

/** Burbujas consecutivas de la secretaria = un solo mensaje del asistente para la API (que exige turnos alternos). */
function toTurns(bubbles: Bubble[]): ChatTurn[] {
  const turns: ChatTurn[] = []
  for (const b of bubbles) {
    if (b.from === 'booking') continue
    const role = b.from === 'me' ? 'user' : 'assistant'
    const last = turns[turns.length - 1]
    if (last && last.role === role) last.content += `\n\n${b.text}`
    else turns.push({ role, content: b.text })
  }
  return turns
}

/** Una respuesta larga se reparte en varias burbujas, como escribe una persona en WhatsApp. */
function splitReply(reply: string): string[] {
  const parts = reply.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (parts.length <= 4) return parts.length ? parts : [reply]
  return [...parts.slice(0, 3), parts.slice(3).join('\n\n')]
}

/** Simulador de WhatsApp: el alumno (o su cliente) habla con la secretaria virtual del agente. Las conversaciones no se guardan. */
export default function WhatsAppChat({ agent, suggestions = [] }: { agent: Agent; suggestions?: string[] }) {
  const toast = useToast()
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const seq = useRef(0)
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const name = agent.config.secretaria.nombre
  const userCount = bubbles.filter((b) => b.from === 'me').length
  const limitReached = userCount >= MAX_USER_MESSAGES

  useEffect(() => { const el = scroller.current; if (el) el.scrollTop = el.scrollHeight }, [bubbles, typing])
  // Al cambiar de agente se empieza una conversación nueva
  useEffect(() => { setBubbles([]); setInput(''); setTyping(false) }, [agent.id])

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || typing || limitReached) return
    const mine: Bubble = { id: ++seq.current, from: 'me', text, at: new Date() }
    const history = [...bubbles, mine]
    setBubbles(history)
    setInput('')
    setTyping(true)
    play('send')
    try {
      const { reply, booking } = await chatWithAgent(agent.id, toTurns(history))
      const parts = splitReply(reply)
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) await wait(Math.min(1500, 500 + parts[i].length * 12)) // "escribiendo…" entre burbujas
        setBubbles((prev) => [...prev, { id: ++seq.current, from: 'bot', text: parts[i], at: new Date() }])
        play('receive')
      }
      if (booking) { setBubbles((prev) => [...prev, { id: ++seq.current, from: 'booking', text: '', at: new Date(), booking }]); setTimeout(() => play('chime'), 250) }
    } catch (e) {
      toast(e instanceof GenerationError ? e.message : 'No se pudo enviar el mensaje. Inténtalo de nuevo.', 'error')
      setBubbles((prev) => prev.filter((b) => b.id !== mine.id))
      setInput(text) // el mensaje vuelve a la caja para reenviarlo
    } finally {
      setTyping(false)
      inputRef.current?.focus()
    }
  }

  const reset = () => { if (!typing) { setBubbles([]); setInput('') } }

  return (
    <div className="flex h-[600px] max-h-[78vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b141a] shadow-[0_20px_60px_rgba(0,0,0,.45)]">
      <div className="flex items-center gap-3 bg-[#202c33] px-4 py-3">
        <span aria-hidden className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#00a884] text-base font-bold text-white">{name.slice(0, 1).toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight text-[#e9edef]">{name} · {agent.business_name}</p>
          <p className="text-xs text-[#8696a0]" aria-live="polite">{typing ? 'escribiendo…' : 'en línea'}</p>
        </div>
        <button type="button" onClick={reset} disabled={typing || bubbles.length === 0} aria-label="Reiniciar la conversación" title="Reiniciar la conversación"
          className="rounded-full p-2 text-[#aebac1] transition hover:bg-white/10 disabled:opacity-30"><RotateCcw className="h-4 w-4" /></button>
      </div>

      <div ref={scroller} role="log" aria-label={`Conversación con ${name}`} className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '22px 22px' }}>
        <p className="mx-auto mb-2 flex max-w-[88%] items-start gap-1.5 rounded-lg bg-[#182229] px-3 py-2 text-center text-[11.5px] leading-snug text-[#8696a0]">
          <Lock className="mt-0.5 h-3 w-3 flex-none" aria-hidden />Conversación de prueba. Escribe como lo haría un cliente de {agent.business_name}. No se guarda.
        </p>
        {bubbles.map((b) => b.from === 'booking' ? (
          <div key={b.id} className="relative mx-auto my-2 w-full max-w-[90%] animate-pop-in overflow-hidden rounded-2xl border border-[#00a884]/50 text-[13px] text-[#cdeee6] shadow-[0_8px_30px_rgba(0,168,132,.25)]" style={{ background: 'linear-gradient(135deg, rgba(0,168,132,.28), rgba(0,92,75,.35))' }}>
            <div className="flex items-center gap-2 border-b border-dashed border-[#00a884]/50 px-3.5 py-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#00a884] text-white"><CalendarCheck className="h-4 w-4" aria-hidden /></span>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#7fe7cd]">Cita registrada</p>
            </div>
            <div className="space-y-0.5 px-3.5 py-2.5">
              <p className="text-[15px] font-semibold leading-snug text-white">{b.booking?.servicio ?? 'Cita'}</p>
              {b.booking?.cuando && <p className="leading-snug">{b.booking.cuando}</p>}
              {(b.booking?.nombre || b.booking?.telefono) && <p className="text-[#8fb9ae]">{[b.booking?.nombre, b.booking?.telefono].filter(Boolean).join(' · ')}</p>}
            </div>
            <span aria-hidden className="absolute -left-2 top-[38px] h-4 w-4 rounded-full bg-[#0b141a]" /><span aria-hidden className="absolute -right-2 top-[38px] h-4 w-4 rounded-full bg-[#0b141a]" />
          </div>
        ) : (
          <div key={b.id} className={`max-w-[82%] whitespace-pre-wrap rounded-lg px-3 py-1.5 text-[14.5px] leading-snug text-[#e9edef] ${b.from === 'me' ? 'self-end rounded-tr-none bg-[#005c4b]' : 'self-start rounded-tl-none bg-[#202c33]'}`}>
            {b.text}
            <span className="ml-2 inline-flex translate-y-1 items-center gap-0.5 text-[10.5px] text-[#8696a0]">{hhmm(b.at)}{b.from === 'me' && <span className="text-[#53bdeb]" aria-hidden>✓✓</span>}</span>
          </div>
        ))}
        {typing && (
          <div className="self-start rounded-lg rounded-tl-none bg-[#202c33] px-3.5 py-3" aria-hidden>
            <span className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8696a0]" style={{ animationDelay: `${i * 150}ms` }} />)}</span>
          </div>
        )}
      </div>

      {userCount === 0 && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 bg-[#0b141a] px-3 pb-2">
          {suggestions.map((s) => (
            <button key={s} type="button" disabled={typing} onClick={() => void send(s)}
              className="rounded-full border border-[#00a884]/40 bg-[#00a884]/10 px-3 py-1.5 text-xs font-medium text-[#7fe7cd] transition hover:bg-[#00a884]/20 disabled:opacity-50">{s}</button>
          ))}
        </div>
      )}

      <form className="flex items-center gap-2 bg-[#202c33] px-3 py-2.5" onSubmit={(e) => { e.preventDefault(); void send(input) }}>
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} disabled={limitReached} autoComplete="off"
          aria-label="Escribe un mensaje" placeholder={limitReached ? 'Reinicia la conversación para seguir probando' : 'Escribe un mensaje'}
          className="min-w-0 flex-1 rounded-full bg-[#2a3942] px-4 py-2.5 text-[15px] text-[#e9edef] placeholder:text-[#8696a0] focus:outline-none" />
        <button type="submit" data-silent disabled={!input.trim() || typing || limitReached} aria-label="Enviar"
          className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#00a884] text-white transition hover:bg-[#06cf9c] disabled:opacity-40"><Send className="h-[18px] w-[18px]" /></button>
      </form>
    </div>
  )
}
