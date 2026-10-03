// Sonidos de la interfaz, sintetizados con Web Audio (sin archivos que descargar). Suaves y cortos; se pueden silenciar y la
// preferencia se recuerda. Los navegadores solo dejan sonar tras un gesto del usuario, así que el contexto se crea en el primer clic.
export type SoundName = 'click' | 'send' | 'receive' | 'success' | 'chime' | 'error'

const KEY = 'maestria-sound'
const read = (): boolean => { try { return localStorage.getItem(KEY) !== '0' } catch { return true } }

let enabled = read()
let ctx: AudioContext | null = null
const listeners = new Set<() => void>()

export const soundEnabled = () => enabled
export const subscribeSound = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
export function setSoundEnabled(on: boolean) {
  enabled = on
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* sin almacenamiento: solo dura esta sesión */ }
  listeners.forEach((l) => l())
  if (on) play('click')
}

function audio(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx ??= new Ctor()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

interface Note { f: number; at?: number; dur: number; type?: OscillatorType; gain?: number; to?: number }

/** Una nota con ataque corto y caída exponencial (sin "clics" al empezar ni acabar). */
function note(c: AudioContext, t0: number, { f, at = 0, dur, type = 'sine', gain = 0.05, to }: Note) {
  const osc = c.createOscillator(), g = c.createGain()
  const t = t0 + at
  osc.type = type
  osc.frequency.setValueAtTime(f, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

const SOUNDS: Record<SoundName, Note[]> = {
  click: [{ f: 1250, to: 760, dur: 0.045, gain: 0.03, type: 'triangle' }],
  send: [{ f: 520, to: 700, dur: 0.07, gain: 0.045 }, { f: 780, at: 0.05, dur: 0.09, gain: 0.04 }],
  receive: [{ f: 900, dur: 0.08, gain: 0.04 }, { f: 680, at: 0.07, dur: 0.12, gain: 0.04 }],
  success: [523.25, 659.25, 783.99, 1046.5].map((f, i) => ({ f, at: i * 0.075, dur: 0.22, gain: 0.045 })),
  chime: [{ f: 1318.5, dur: 0.6, gain: 0.05 }, { f: 1976, at: 0.04, dur: 0.7, gain: 0.03 }, { f: 2637, at: 0.08, dur: 0.5, gain: 0.015 }],
  error: [{ f: 240, to: 150, dur: 0.18, gain: 0.04, type: 'sawtooth' }],
}

export function play(name: SoundName) {
  if (!enabled) return
  const c = audio()
  if (!c) return
  const t0 = c.currentTime
  for (const n of SOUNDS[name]) note(c, t0, n)
}

/** Un tic suave al pulsar cualquier botón, enlace o pestaña. Lo que quiera su propio sonido se marca con data-silent. */
export function installClickSound() {
  // El primer gesto del usuario (clic, tecla o toque) desbloquea el audio: así los sonidos que llegan después, de forma asíncrona, sí suenan
  const unlock = () => { audio(); for (const t of ['pointerdown', 'keydown']) document.removeEventListener(t, unlock, true) }
  for (const t of ['pointerdown', 'keydown']) document.addEventListener(t, unlock, { capture: true, passive: true })
  document.addEventListener('pointerdown', (e) => {
    const el = (e.target as Element | null)?.closest?.('button, a[href], [role="tab"], [role="button"], summary')
    if (!el || el.hasAttribute('data-silent') || (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return
    play('click')
  }, { capture: true, passive: true })
}
