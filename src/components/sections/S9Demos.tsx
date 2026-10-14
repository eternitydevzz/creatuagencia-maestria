import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, Globe, PenLine, Trash2 } from 'lucide-react'
import { buildAgentPrompt, nowText } from '@shared/agent'
import { currencyOf, marketOf } from '@shared/currency'
import { AiButton, CopyButton, Empty, Skeleton } from '@/components/ui/bits'
import WhatsAppChat from '@/components/agent/WhatsAppChat'
import { useDemos } from '@/hooks/useData'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { useToast } from '@/hooks/useToast'
import { supabase } from '@/lib/supabase'
import type { Agent } from '@/lib/types'

type Mode = 'url' | 'manual'
const EMPTY_MANUAL = { nombre: '', rubro: '', descripcion: '', servicios: '', horario: '', ubicacion: '' }

export default function S9Demos({ roadmap, refresh }: SectionProps) {
  const qc = useQueryClient()
  const toast = useToast()
  const { data: demos, isLoading } = useDemos(roadmap.id)
  const reload = useCallback(async () => { await refresh(); await qc.invalidateQueries({ queryKey: ['demos', roadmap.id] }) }, [refresh, qc, roadmap.id])
  const { run, isBusy } = useGenerate(roadmap.id, reload)
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState('')
  const [manual, setManual] = useState(EMPTY_MANUAL)
  const [selected, setSelected] = useState<string | null>(null)
  const busy = isBusy('demo_agent')
  const money = marketOf(currencyOf(roadmap.pricing_settings))

  // Al crear una demo nueva se abre sola; si se borra la abierta, se abre la primera que quede
  useEffect(() => {
    if (!demos?.length) { setSelected(null); return }
    if (!selected || !demos.some((d) => d.id === selected)) setSelected(demos[0].id)
  }, [demos, selected])

  const create = async () => {
    const res = await run('demo_agent', mode === 'url' ? { url } : { manual }, { silent: true })
    if (res) { toast('Demo creada. Pruébala a la derecha.'); setUrl(''); setManual(EMPTY_MANUAL) }
  }
  const remove = async (d: Agent) => {
    if (!window.confirm(`¿Borrar la demo de «${d.business_name}»?`)) return
    const { error } = await supabase.from('agents').delete().eq('id', d.id)
    if (error) { toast('No se pudo borrar la demo.', 'error'); return }
    await reload()
  }

  const current = demos?.find((d) => d.id === selected)
  const canCreate = mode === 'url' ? url.trim().length >= 4 : manual.nombre.trim().length >= 2 && manual.rubro.trim().length >= 2
  const setM = (k: keyof typeof EMPTY_MANUAL) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setManual((m) => ({ ...m, [k]: e.target.value }))

  if (isLoading) return <Skeleton rows={3} />

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start">
      <div className="space-y-5">
        <div className="card space-y-4 p-5">
          <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1" role="tablist" aria-label="Origen de los datos">
            {([['url', Globe, 'Desde su web'], ['manual', PenLine, 'A mano']] as const).map(([m, Icon, label]) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${mode === m ? 'bg-accent text-white' : 'text-muted hover:text-white'}`}><Icon className="h-4 w-4" />{label}</button>
            ))}
          </div>

          {mode === 'url' ? (
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-white">Web del negocio</span>
              <input className="field" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="propai-app.com" inputMode="url" maxLength={300} autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter' && canCreate && !busy) void create() }} />
              <span className="block text-xs text-muted">La IA lee la portada y las páginas de servicios o contacto y prepara su secretaria. Si la web no tiene texto que leer, usa «A mano».</span>
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-white">Nombre del negocio *</span><input className="field" value={manual.nombre} onChange={setM('nombre')} maxLength={120} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-white">Rubro *</span><input className="field" value={manual.rubro} onChange={setM('rubro')} placeholder="clínica dental, taller…" maxLength={120} /></label>
              <label className="block space-y-1.5 sm:col-span-2"><span className="text-sm font-semibold text-white">Qué hacen</span><input className="field" value={manual.descripcion} onChange={setM('descripcion')} maxLength={500} /></label>
              <label className="block space-y-1.5 sm:col-span-2"><span className="text-sm font-semibold text-white">Servicios y precios (uno por línea)</span>
                <textarea className="field min-h-28" value={manual.servicios} onChange={setM('servicios')} placeholder={`Limpieza dental - ${money.fmt(60)} - 45 min\nBlanqueamiento - ${money.fmt(250)}`} maxLength={1500} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-white">Horario</span><input className="field" value={manual.horario} onChange={setM('horario')} placeholder="L-V 9:00-20:00" maxLength={200} /></label>
              <label className="block space-y-1.5"><span className="text-sm font-semibold text-white">Dirección</span><input className="field" value={manual.ubicacion} onChange={setM('ubicacion')} maxLength={200} /></label>
            </div>
          )}

          <AiButton onClick={() => void create()} busy={busy} cost={1} disabled={!canCreate}>Crear la demo</AiButton>
        </div>

        {demos?.length ? (
          <div className="stagger space-y-2.5">
            <p className="eyebrow px-1">Tus demos · {demos.length}</p>
            {demos.map((d) => (
              <div key={d.id} className={`card flex items-center gap-3 p-3.5 ${d.id === selected ? '!border-accent/60 bg-accent/10' : ''}`}>
                <button type="button" onClick={() => setSelected(d.id)} aria-pressed={d.id === selected} className="min-w-0 flex-1 text-left">
                  <p className="truncate font-semibold text-white">{d.business_name}</p>
                  <p className="truncate text-xs text-muted">{d.config.negocio.rubro} · {d.config.secretaria.nombre}{d.config.origen?.url ? ` · ${new URL(d.config.origen.url).hostname}` : ''}</p>
                </button>
                <button type="button" onClick={() => void remove(d)} aria-label={`Borrar la demo de ${d.business_name}`} title="Borrar"
                  className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-[#ffb3b3]"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        ) : <Empty icon={Building2}>Aún no has creado ninguna demo. Pega la web de un negocio de tu nicho para empezar.</Empty>}
      </div>

      <div className="space-y-3">
        {current ? (
          <>
            <WhatsAppChat agent={current} suggestions={['Hola', 'Quiero pedir cita', '¿Qué servicios tenéis?', '¿Dónde estáis y qué horario tenéis?']} />
            <CopyButton className="w-full" text={buildAgentPrompt(current.config, nowText(current.config.negocio.zona_horaria))} label="Copiar las instrucciones de esta secretaria" />
          </>
        ) : (
          <div className="card p-5 text-sm text-muted"><p className="font-semibold text-white">Así se usa en una venta</p><p className="mt-1">Antes de la llamada, crea la demo del negocio. En la llamada, enséñale su propia secretaria atendiendo: es la prueba más rápida de que funciona.</p></div>
        )}
      </div>
    </div>
  )
}
