import { useCallback, useSyncExternalStore } from 'react'
import { generate, GenerationError, type GenerationResult } from '@/lib/api'
import { useToast } from './useToast'
import { play } from '@/lib/sound'
import type { EditablePatch, GenerationKind, Roadmap } from '@/lib/types'

export interface SectionProps {
  roadmap: Roadmap
  update: (patch: EditablePatch) => void
  refresh: () => Promise<void>
}

// Generaciones en curso, a nivel de aplicación: si el alumno cambia de paso mientras la IA trabaja y vuelve, el botón
// sigue mostrando "Generando…" en vez de dejarle pulsarlo otra vez (el servidor tampoco lo permitiría).
const inflight = new Set<string>()
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
// Nueva referencia en cada cambio, para que useSyncExternalStore detecte que algo cambió
let snapshot = ''
const setBusy = (key: string, on: boolean) => { on ? inflight.add(key) : inflight.delete(key); snapshot = [...inflight].sort().join('|'); emit() }

/** Ejecuta generaciones con IA: controla el estado de carga por proyecto y tipo, muestra errores claros y refresca datos y créditos. */
export function useGenerate(roadmapId: string, refresh: () => Promise<void>) {
  const toast = useToast()
  useSyncExternalStore(subscribe, () => snapshot)

  const run = useCallback(async <T = unknown>(kind: GenerationKind, params: Record<string, unknown> = {}, opts: { silent?: boolean; refresh?: boolean } = {}): Promise<GenerationResult<T> | null> => {
    const key = `${roadmapId}:${kind}`
    if (inflight.has(key)) return null
    setBusy(key, true)
    try {
      const res = await generate<T>(kind, roadmapId, params)
      if (opts.refresh !== false) await refresh()
      if (!opts.silent) toast('Listo: generado con IA')
      play('receive')
      return res
    } catch (e) {
      const err = e instanceof GenerationError ? e : new GenerationError('internal_error', 'Algo ha fallado. Inténtalo de nuevo.')
      toast(err.message, 'error')
      // Si el servidor devolvió los créditos, refrescamos el saldo igualmente
      if (err.creditsLeft !== undefined) await refresh()
      return null
    } finally {
      setBusy(key, false)
    }
  }, [roadmapId, refresh, toast])

  return { run, isBusy: (k: GenerationKind) => inflight.has(`${roadmapId}:${k}`) }
}
