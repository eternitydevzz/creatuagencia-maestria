import { CopyButton } from '@/components/ui/bits'
import { Tree } from '@/components/ui/Tree'
import Deliverable, { Expandable, Highlights } from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { staleness } from '@/lib/freshness'
import { str, treeToText } from '@/lib/tree'
import type { JsonObject } from '@/lib/types'

export default function S4IdealClient({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const c = roadmap.ideal_client
  const { resumen, coste_del_problema, avatar, ...rest } = c // lo destacado va arriba; el resto, en el detalle
  const person = avatar as JsonObject | undefined
  const missing = !roadmap.selected_problems.length ? 'Elige al menos un problema en el paso 1.' : !roadmap.selected_nichos.length ? 'Elige tu nicho en el paso 2.' : false

  return (
    <Deliverable missing={missing} stale={staleness(roadmap).ideal} done={Object.keys(c).length > 0} busy={isBusy('ideal_client')} cost={2} label="Generar mi cliente ideal"
      pending="La IA usa tus problemas, tu nicho y tus números." onGenerate={() => void run('ideal_client')}
      actions={<CopyButton text={treeToText(c)} />}>
      <Highlights items={[['Quién es', str(resumen)], ['Lo que le cuesta el problema', str(coste_del_problema)], ['Avatar', str(person?.nombre)], ['Su día a día', str(person?.dia_a_dia)]]} />
      <Expandable label="Ver la ficha completa: perfil, dolores, su lenguaje, dónde encontrarlo…"><Tree v={rest} /></Expandable>
    </Deliverable>
  )
}
