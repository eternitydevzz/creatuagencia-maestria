import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Spinner } from '@/components/ui/bits'

export default function NewProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session } = useAuth()
  const nav = useNavigate(); const qc = useQueryClient(); const toast = useToast()
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) { setName(''); setTimeout(() => ref.current?.focus(), 30) } }, [open])
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [open, onClose])
  if (!open) return null

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    const project_name = name.trim()
    if (!project_name || !session) return
    setBusy(true)
    const { data, error } = await supabase.from('roadmaps').insert({ project_name, user_id: session.user.id, status: 'draft' }).select('id').single()
    setBusy(false)
    if (error || !data) return toast('No se pudo crear el proyecto. Inténtalo de nuevo.', 'error')
    await qc.invalidateQueries({ queryKey: ['roadmaps'] })
    onClose(); nav(`/roadmap/${data.id}`)
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Nuevo proyecto" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <form onSubmit={create} className="card w-full max-w-md animate-step-in space-y-4 !bg-card p-6">
        <h2 className="text-xl font-bold">Nuevo proyecto</h2>
        <label className="block text-sm font-semibold">Nombre del proyecto<input ref={ref} className="field mt-1.5 font-normal" placeholder="Mi agencia de IA" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="flex justify-end gap-3"><button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button><button className="btn" type="submit" disabled={busy || !name.trim()}>{busy && <Spinner />}Crear proyecto</button></div>
      </form>
    </div>
  )
}
