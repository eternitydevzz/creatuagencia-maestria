// Cada entregable guarda (en `_meta`) las respuestas con las que se generó. Si el alumno las cambia después, o regenera el
// entregable del que depende, lo avisamos: sin esto, la oferta y la landing se quedarían contando algo que ya no es verdad.
import { inputsSignature } from '@shared/signature'
import type { DeliverableMeta, Roadmap } from './types'

const metaOf = (o: object | undefined): DeliverableMeta | undefined => (o as { _meta?: DeliverableMeta } | undefined)?._meta
const CHANGED = 'Has cambiado tus respuestas (problemas, nicho, números o nombre) después de generar esto. Regéneralo para que esté al día.'

interface Staleness { ideal: string | null; offer: string | null; site: string | null }

export function staleness(r: Roadmap): Staleness {
  const ideal = metaOf(r.ideal_client)
  const offer = metaOf(r.agency_offer)
  const site = metaOf(r.agency_site)
  return {
    ideal: ideal && ideal.inputs !== inputsSignature(r, false) ? CHANGED : null,
    offer: offer && offer.inputs !== inputsSignature(r, true) ? CHANGED
      : offer?.ideal_at && ideal && offer.ideal_at !== ideal.generated_at ? 'Has regenerado tu cliente ideal después de crear esta oferta. Regenera la oferta para que lo use.' : null,
    site: site && site.inputs !== inputsSignature(r, true) ? CHANGED
      : site?.offer_at && offer && site.offer_at !== offer.generated_at ? 'Has regenerado tu oferta después de crear esta landing. Regenera la landing para que la use.' : null,
  }
}
