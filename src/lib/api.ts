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
  unauthorized: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
}

/** Llama a la Edge Function `generate`. Los prompts se construyen en el servidor; aquí solo viajan parámetros. */
export async function generate<T = unknown>(kind: GenerationKind, roadmapId: string, params: Record<string, unknown> = {}): Promise<GenerationResult<T>> {
  const { data, error } = await supabase.functions.invoke('generate', { body: { kind, roadmap_id: roadmapId, params } })
  if (error) {
    let code = 'internal_error'; let message = 'Algo ha fallado. Inténtalo de nuevo.'; let creditsLeft: number | undefined
    const res = (error as { context?: Response }).context
    if (res && typeof res.json === 'function') {
      try {
        const body = await res.json()
        code = body.error ?? code; creditsLeft = body.credits_left
        message = MESSAGES[code] ?? body.message ?? message
      } catch { /* cuerpo no JSON */ }
    }
    throw new GenerationError(code, message, creditsLeft)
  }
  return data as GenerationResult<T>
}
