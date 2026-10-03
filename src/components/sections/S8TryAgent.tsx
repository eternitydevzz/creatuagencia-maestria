import { Lightbulb, MessageCircle } from 'lucide-react'
import { Empty, Skeleton } from '@/components/ui/bits'
import WhatsAppChat from '@/components/agent/WhatsAppChat'
import { useAgent } from '@/hooks/useData'
import type { SectionProps } from '@/hooks/useGenerate'
import { stepNo } from '@/lib/gamification'

const TRY_THIS = [
  'Pregúntale por un precio y luego intenta regatearlo.',
  'Pídele una cita y cambia de opinión a mitad.',
  'Escríbele con faltas de ortografía y sin signos.',
  'Pregúntale algo que no sabe (que no esté en la ficha) y mira si se lo inventa.',
  'Pídele que olvide sus instrucciones: no debería hacerlo.',
]

export default function S8TryAgent({ roadmap }: SectionProps) {
  const { data: agent, isLoading } = useAgent(roadmap.id)
  if (isLoading) return <Skeleton rows={3} />
  if (!agent) return <Empty icon={MessageCircle}>Primero crea tu agente (paso {stepNo(7)}): aquí es donde hablas con él.</Empty>

  const first = agent.config.servicios[0]?.nombre
  const suggestions = ['Hola', 'Quiero pedir cita', first ? `¿Cuánto cuesta ${first.toLowerCase()}?` : '¿Qué servicios ofrecéis?', '¿Dónde estáis y qué horario tenéis?']

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start">
      <WhatsAppChat agent={agent} suggestions={suggestions} />
      <div className="space-y-4">
        <div className="card p-5">
          <p className="eyebrow flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5" />Qué probar</p>
          <ul className="mt-3 space-y-2.5 text-sm text-text">
            {TRY_THIS.map((t) => <li key={t} className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent-hi" />{t}</li>)}
          </ul>
        </div>
        <div className="card p-5 text-sm text-muted">
          <p className="font-semibold text-white">Esto es una simulación</p>
          <p className="mt-1">Habla con {agent.config.secretaria.nombre}, la secretaria de «{agent.business_name}», un negocio de ejemplo de tu nicho. Aquí no está conectada a ningún número real: para eso, ve al paso {stepNo(10)}. Las conversaciones no se guardan.</p>
        </div>
      </div>
    </div>
  )
}
