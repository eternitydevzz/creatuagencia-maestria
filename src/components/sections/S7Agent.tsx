import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, ShieldCheck, Zap, type LucideIcon } from 'lucide-react'
import { buildAgentPrompt, nowText } from '@shared/agent'
import { CopyButton, Skeleton } from '@/components/ui/bits'
import { Tree } from '@/components/ui/Tree'
import Deliverable, { Expandable, Highlights } from '@/components/Deliverable'
import { useAgent } from '@/hooks/useData'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { agentStaleness } from '@/lib/freshness'
import type { JsonObject } from '@/lib/types'

const BENEFITS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: Zap, title: 'Responde en segundos', text: 'A las 3 de la madrugada igual que a las 10 de la mañana.' },
  { icon: CalendarCheck, title: 'Agenda sola', text: 'Pregunta el motivo, pide los datos y propone horarios.' },
  { icon: ShieldCheck, title: 'Solo dice lo que sabe', text: 'Precios y horarios salen de la ficha del negocio: no inventa.' },
]

export default function S7Agent({ roadmap, refresh }: SectionProps) {
  const qc = useQueryClient()
  const { data: agent, isLoading } = useAgent(roadmap.id)
  const reload = useCallback(async () => { await refresh(); await qc.invalidateQueries({ queryKey: ['agent', roadmap.id] }) }, [refresh, qc, roadmap.id])
  const { run, isBusy } = useGenerate(roadmap.id, reload)
  const cfg = agent?.config
  const missing = roadmap.selected_nichos.length === 0 && 'Primero elige tu nicho (paso 2): el agente se crea para un negocio típico de ese nicho.'

  if (isLoading) return <Skeleton rows={3} />

  return (
    <div className="space-y-5">
      <div className="stagger grid gap-3 sm:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="card card-lift p-4">
            <span className="tile-icon grid h-10 w-10"><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /></span>
            <p className="mt-3 font-semibold text-white">{title}</p>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>

      <Deliverable missing={missing} stale={agent ? agentStaleness(roadmap, agent) : null} done={!!agent} busy={isBusy('agent')} cost={1} label="Crear mi agente"
        pending="La IA inventa un negocio típico de tu nicho y le da una secretaria que ya sabe atender. Después la pruebas en el paso 8."
        onGenerate={() => void run('agent')}
        actions={cfg && <CopyButton text={buildAgentPrompt(cfg, nowText(cfg.negocio.zona_horaria))} label="Copiar instrucciones" />}>
        {cfg && (
          <>
            <Highlights items={[
              ['Negocio de ejemplo', `${cfg.negocio.nombre} · ${cfg.negocio.rubro}`],
              ['Secretaria', `${cfg.secretaria.nombre} · ${cfg.secretaria.tono}`],
              ['Servicios que conoce', `${cfg.servicios.length} servicios con precio y duración`],
              ['Horario', cfg.negocio.horario],
            ]} />
            <Expandable label="Ver la ficha del negocio y las instrucciones del agente">
              <div className="space-y-6">
                <Tree v={cfg as unknown as JsonObject} />
                <div>
                  <h3 className="mb-2 text-lg font-bold text-white">Instrucciones del agente</h3>
                  <p className="mb-2 text-sm text-muted">Es lo que lee la secretaria antes de cada conversación. Puedes copiarlo y pegarlo en la plataforma de WhatsApp que uses.</p>
                  <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-bg-deep/60 p-4 text-xs leading-relaxed text-text">{buildAgentPrompt(cfg, nowText(cfg.negocio.zona_horaria))}</pre>
                </div>
              </div>
            </Expandable>
          </>
        )}
      </Deliverable>
    </div>
  )
}
