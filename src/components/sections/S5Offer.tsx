import { CopyButton } from '@/components/ui/bits'
import { Tree } from '@/components/ui/Tree'
import Deliverable, { Expandable, Highlights } from '@/components/Deliverable'
import { useGenerate, type SectionProps } from '@/hooks/useGenerate'
import { staleness } from '@/lib/freshness'
import { str, treeToText } from '@/lib/tree'
import type { JsonObject } from '@/lib/types'

export default function S5Offer({ roadmap, refresh }: SectionProps) {
  const { run, isBusy } = useGenerate(roadmap.id, refresh)
  const o = roadmap.agency_offer
  const offer = (o.oferta ?? {}) as JsonObject
  const price = (offer.precio ?? {}) as JsonObject
  const missing = Object.keys(roadmap.ideal_client).length === 0 && 'Primero genera tu cliente ideal (paso 4): la oferta se construye sobre él.'

  return (
    <Deliverable missing={missing} stale={staleness(roadmap).offer} done={Object.keys(offer).length > 0} busy={isBusy('agency_offer')} cost={3} label="Generar mi oferta"
      pending="La IA usa tu cliente ideal y tu modo de precios." onGenerate={() => void run('agency_offer')}
      actions={<CopyButton text={treeToText(o)} />}>
      <Highlights items={[
        ['Nombre', str(offer.nombre)],
        ['Promesa', str(offer.promesa)],
        ['Precio', [str(price.setup), str(price.mensual)].filter(Boolean).join(' + ') || undefined],
        ['Garantía', str(offer.garantia)],
      ]} />
      <Expandable label="Ver la oferta completa: qué incluye, objeciones, oferta piloto, escalera de precios…"><Tree v={o} /></Expandable>
    </Deliverable>
  )
}
