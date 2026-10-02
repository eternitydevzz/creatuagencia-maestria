import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { EditablePatch, Profile, Roadmap, RoadmapSummary } from '@/lib/types'

export function useProfile() {
  const { session } = useAuth()
  const uid = session?.user.id
  return useQuery({
    queryKey: ['profile', uid], enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid!).single()
      if (error) throw error
      return data as Profile
    },
  })
}

// Las listas (cabecera, dashboard, proyectos) solo necesitan saber qué pasos lleva hecho cada proyecto:
// de los entregables (que pesan decenas de KB) se pide únicamente un campo para saber si existen.
const SUMMARY_COLUMNS = 'id,project_name,agency_name,status,updated_at,selected_problems,selected_nichos,business_metrics,ideal:ideal_client->>resumen,offer:agency_offer->oferta->>nombre,site:agency_site->hero->>titulo'
type SummaryRow = Omit<RoadmapSummary, 'has_ideal' | 'has_offer' | 'has_site'> & { ideal: string | null; offer: string | null; site: string | null }

export function useRoadmaps() {
  const { session } = useAuth()
  const uid = session?.user.id
  return useQuery({
    queryKey: ['roadmaps', uid], enabled: !!uid,
    queryFn: async (): Promise<RoadmapSummary[]> => {
      const { data, error } = await supabase.from('roadmaps').select(SUMMARY_COLUMNS).order('updated_at', { ascending: false }).returns<SummaryRow[]>()
      if (error) throw error
      return data.map(({ ideal, offer, site, ...r }) => ({ ...r, has_ideal: !!ideal, has_offer: !!offer, has_site: !!site }))
    },
  })
}

export function useGenerationCount() {
  const { session } = useAuth()
  const uid = session?.user.id
  return useQuery({
    queryKey: ['generations-count', uid], enabled: !!uid,
    queryFn: async () => {
      const { count, error } = await supabase.from('generations').select('id', { count: 'exact', head: true }).eq('status', 'succeeded')
      if (error) throw error
      return count ?? 0
    },
  })
}

const RETRY_MS = 4000

/** Un proyecto con autoguardado: los cambios del alumno se ven al instante y se guardan (agrupados) 700 ms después.
 *  Los guardados van uno detrás de otro (nunca dos a la vez) y, si fallan, se reintentan solos. */
export function useRoadmap(id: string | undefined) {
  const qc = useQueryClient()
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const pending = useRef<EditablePatch>({})
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const queue = useRef<Promise<void>>(Promise.resolve())

  const load = useCallback(async () => {
    if (!id) return
    const { data, error } = await supabase.from('roadmaps').select('*').eq('id', id).maybeSingle()
    if (error) console.error('[roadmap] error al cargar', error)
    // Lo que el alumno haya escrito mientras tanto y aún no esté guardado se conserva encima de lo recién cargado.
    setRoadmap(data ? ({ ...data, ...pending.current } as Roadmap) : null)
    setLoading(false)
  }, [id])

  useEffect(() => { setLoading(!!id); setRoadmap(null); void load() }, [id, load])

  const flush = useCallback((): Promise<void> => {
    queue.current = queue.current.then(async () => {
      if (!id || !Object.keys(pending.current).length) return
      const patch = pending.current
      pending.current = {}
      setSaving(true)
      const { error } = await supabase.from('roadmaps').update(patch).eq('id', id)
      setSaving(false)
      if (error) {
        console.error('[roadmap] error al guardar', error)
        pending.current = { ...patch, ...pending.current } // lo más reciente manda
        setSaveFailed(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => void flush(), RETRY_MS)
      } else {
        setSaveFailed(false)
        void qc.invalidateQueries({ queryKey: ['roadmaps'] })
      }
    })
    return queue.current
  }, [id, qc])

  const update = useCallback((patch: EditablePatch) => {
    setRoadmap((r) => (r ? { ...r, ...patch } as Roadmap : r))
    pending.current = { ...pending.current, ...patch }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), 700)
  }, [flush])

  // Guardar al salir de la pantalla o al cerrar la pestaña
  useEffect(() => {
    const onHide = () => void flush()
    window.addEventListener('pagehide', onHide)
    return () => { window.removeEventListener('pagehide', onHide); clearTimeout(timer.current); void flush() }
  }, [flush])

  /** Recarga tras una generación (el servidor ya ha guardado el resultado) y refresca créditos y XP. */
  const refresh = useCallback(async () => {
    await flush()
    await load()
    void qc.invalidateQueries({ queryKey: ['profile'] })
    void qc.invalidateQueries({ queryKey: ['generations-count'] })
    void qc.invalidateQueries({ queryKey: ['roadmaps'] })
  }, [flush, load, qc])

  return { roadmap, loading, saving, saveFailed, update, refresh }
}
