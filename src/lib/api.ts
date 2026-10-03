import { supabase } from './supabase'
import type { GenerationKind } from './types'

export class GenerationError extends Error {
  constructor(public code: string, message: string, public creditsLeft?: number) { super(message) }
}

export interface GenerationResult<T = unknown> {
  generation_id: string; kind: GenerationKind; parsed: T; credits_left: number
}

const MESSAGES: Record<string, string> = {
  insufficient_credits: 'No te quedan créditos. Pide más a tu equipo de MaestrIA.',
  rate_limited: 'Vas muy rápido. Espera unos segundos y vuelve a intentarlo.',
  ai_busy: 'La IA está saturada en este momento. Inténtalo de nuevo en un momento.',
  ai_error: 'La IA no respondió correctamente. No se ha descontado ningún crédito.',
  ai_not_configured: 'La IA aún no está configurada en el servidor.',
  refused: 'La IA no pudo atender esta petición. Reformúlala e inténtalo de nuevo.',
  already_running: 'Ya se está generando esto. Espera a que termine.',
  invalid_model_output: 'La IA no devolvió un resultado válido. No se ha descontado ningún crédito: inténtalo de nuevo.',
  timeout: 'La IA ha tardado demasiado. Se te han devuelto los créditos: inténtalo de nuevo.',
  unauthorized: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  agent_not_found: 'No se encuentra este agente. Recarga la página.',
  consent_required: 'Para vincular un número tienes que aceptar el aviso sobre tus clientes.',
}
const GENERIC = 'Algo ha fallado. Inténtalo de nuevo.'

/** Llama a la Edge Function `generate`. Los prompts se construyen en el servidor; aquí solo viajan parámetros.
 *  Los errores previos a la generación llegan como HTTP de error; los que ocurren durante ella (la función ya había empezado a
 *  responder con un latido) llegan como un 200 cuyo cuerpo trae `error`. */
export async function generate<T = unknown>(kind: GenerationKind, roadmapId: string, params: Record<string, unknown> = {}): Promise<GenerationResult<T>> {
  const { data, error } = await supabase.functions.invoke('generate', { body: { kind, roadmap_id: roadmapId, params } })
  if (error) {
    let code = 'internal_error'; let message = GENERIC; let creditsLeft: number | undefined
    const res = (error as { context?: Response }).context
    if (res && typeof res.json === 'function') {
      try {
        const body = await res.json()
        code = body.error ?? code; creditsLeft = body.credits_left
        message = MESSAGES[code] ?? body.message ?? message
      } catch { /* cuerpo no JSON */ }
    } else {
      message = 'Se interrumpió la conexión con la IA. Revisa tus créditos y vuelve a intentarlo.'
    }
    throw new GenerationError(code, message, creditsLeft)
  }
  if (data && typeof data === 'object' && 'error' in data) {
    const d = data as { error: string; message?: string; credits_left?: number }
    throw new GenerationError(d.error, MESSAGES[d.error] ?? d.message ?? GENERIC, d.credits_left)
  }
  if (!data || typeof data !== 'object' || !('parsed' in data)) throw new GenerationError('internal_error', GENERIC)
  return data as GenerationResult<T>
}

export interface ChatTurn { role: 'user' | 'assistant'; content: string }

/** Una respuesta de la secretaria virtual (Edge Function `agent-chat`). La conversación viaja completa; las instrucciones
 *  se construyen en el servidor a partir de la ficha del agente. No cuesta créditos. */
export interface ChatBooking { nombre?: string; telefono?: string; servicio?: string; cuando?: string; notas?: string }

export async function chatWithAgent(agentId: string, messages: ChatTurn[]): Promise<{ reply: string; booking: ChatBooking | null }> {
  const { data, error } = await supabase.functions.invoke('agent-chat', { body: { agent_id: agentId, messages } })
  if (error) {
    let code = 'internal_error'; let message = GENERIC
    const res = (error as { context?: Response }).context
    if (res && typeof res.json === 'function') {
      try { const body = await res.json(); code = body.error ?? code; message = MESSAGES[code] ?? body.message ?? message } catch { /* cuerpo no JSON */ }
    } else message = 'Se interrumpió la conexión. Inténtalo de nuevo.'
    throw new GenerationError(code, message)
  }
  if (!data || typeof data.reply !== 'string') throw new GenerationError('internal_error', GENERIC)
  return { reply: data.reply, booking: (data.booking as ChatBooking | null) ?? null }
}

/** Vincular un número de WhatsApp a un agente (Edge Function `wa-connect`). */
export async function waConnect<T = Record<string, unknown>>(body: { action: 'start'; agent_id: string; accepted: boolean } | { action: 'status' | 'qr' | 'disconnect'; connection_id: string }): Promise<T> {
  const { data, error } = await supabase.functions.invoke('wa-connect', { body })
  if (error) {
    let code = 'internal_error'; let message = GENERIC
    const res = (error as { context?: Response }).context
    if (res && typeof res.json === 'function') {
      try { const b = await res.json(); code = b.error ?? code; message = MESSAGES[code] ?? b.message ?? message } catch { /* cuerpo no JSON */ }
    } else message = 'Se interrumpió la conexión. Inténtalo de nuevo.'
    throw new GenerationError(code, message)
  }
  return data as T
}

export interface Student { id: string; email: string; full_name: string | null; role: 'student' | 'admin'; credits: number; created_at: string; projects: number; last_sign_in_at: string | null }
export interface Credentials { id: string; email: string; password: string; credits?: number }

/** Gestión de alumnos (Edge Function `admin-students`): solo funciona con una cuenta administradora. */
export async function adminStudents<T = Record<string, unknown>>(body:
  | { action: 'list' }
  | { action: 'create'; email: string; name: string; credits: number }
  | { action: 'grant'; id: string; amount: number }
  | { action: 'reset_password' | 'delete'; id: string }): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-students', { body })
  if (error) {
    let message = GENERIC
    const res = (error as { context?: Response }).context
    if (res && typeof res.json === 'function') { try { const b = await res.json(); message = b.message ?? MESSAGES[b.error] ?? message } catch { /* cuerpo no JSON */ } }
    else message = 'Se interrumpió la conexión. Inténtalo de nuevo.'
    throw new GenerationError('admin_error', message)
  }
  return data as T
}

/** Crea (o recupera) el proyecto de ejemplo terminado en la cuenta del alumno. */
export async function loadSample(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('load-sample', { body: {} })
  if (error || !data?.roadmap_id) throw new GenerationError('internal_error', 'No se pudo cargar el ejemplo. Inténtalo de nuevo.')
  return data.roadmap_id as string
}
