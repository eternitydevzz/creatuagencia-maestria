import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useRoadmaps } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import { SECTIONS, completedCount } from '@/lib/gamification'
import { Empty, StatusBadge } from '@/components/ui/bits'
import NewProjectModal from '@/components/NewProjectModal'

export default function Projects() {
  const { data: roadmaps, isLoading } = useRoadmaps()
  const [creating, setCreating] = useState(false)
  const qc = useQueryClient(); const toast = useToast()

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar «${name}»? Se borrarán todos sus contenidos y no se puede deshacer.`)) return
    const { error } = await supabase.from('roadmaps').delete().eq('id', id)
    if (error) return toast('No se pudo eliminar el proyecto.', 'error')
    await qc.invalidateQueries({ queryKey: ['roadmaps'] }); toast('Proyecto eliminado')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-3xl font-bold">Mis proyectos</h1><p className="text-muted">Cada proyecto es una agencia o un nicho distinto.</p></div><button className="btn" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Nuevo proyecto</button></div>
      {isLoading ? <div className="card h-24 animate-pulse" /> : !roadmaps?.length ? <Empty>Todavía no tienes proyectos. Crea el primero para empezar tu Mapa de Ruta.</Empty> : (
        <div className="grid gap-3">
          {roadmaps.map((r) => {
            const done = completedCount(r)
            return (
              <div key={r.id} className="card flex items-center gap-4 p-4">
                <Link to={`/roadmap/${r.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <img src="/brand/logo-icono.png" alt="" className="h-12 w-12 rounded-xl" />
                  <div className="min-w-0"><p className="truncate font-bold text-white">{r.project_name}</p><p className="text-sm text-muted">{r.agency_name ? `${r.agency_name} · ` : ''}{r.selected_nichos[0] ?? 'Sin nicho'} · {done}/{SECTIONS.length} secciones · {new Date(r.updated_at).toLocaleDateString('es-ES')}</p></div>
                </Link>
                <StatusBadge status={r.status} />
                <button type="button" className="rounded-xl p-2 text-muted hover:bg-white/5 hover:text-[#ff8f8f]" onClick={() => void remove(r.id, r.project_name)} aria-label={`Eliminar ${r.project_name}`}><Trash2 className="h-5 w-5" /></button>
              </div>
            )
          })}
        </div>
      )}
      <NewProjectModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
