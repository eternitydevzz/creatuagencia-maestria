// Huella de las respuestas del alumno que alimentan a la IA. El servidor la guarda junto a cada entregable al generarlo
// y el frontend la recalcula: si no coincide, el entregable está desactualizado. Archivo compartido (sin APIs de Deno).

interface SignatureSource {
  agency_name?: string | null
  selected_problems?: unknown
  custom_problem_descriptions?: unknown
  selected_nichos?: unknown
  business_metrics?: unknown
  pricing_settings?: unknown
}

const empty = (v: unknown) => v === undefined || v === null || v === ''

/** JSON con las claves ordenadas y sin valores vacíos: Postgres (jsonb) y el navegador ordenan las claves distinto. */
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>
    return `{${Object.keys(o).sort().filter((k) => !empty(o[k])).map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(',')}}`
  }
  return JSON.stringify(v ?? null)
}

/** El nombre de la agencia solo cuenta para la oferta y la landing (el cliente ideal no lo usa). */
export function inputsSignature(r: SignatureSource, withAgency: boolean): string {
  return stable({
    agency: withAgency ? r.agency_name : undefined,
    problems: r.selected_problems ?? [],
    custom: r.custom_problem_descriptions ?? {},
    niches: r.selected_nichos ?? [],
    metrics: r.business_metrics ?? {},
    pricing: r.pricing_settings ?? {},
  })
}

/** Metadatos que el servidor añade a cada entregable (clave `_meta`, que la interfaz no muestra). */
export interface DeliverableMeta {
  generated_at: string
  inputs: string
  ideal_at?: string | null // la oferta: fecha del cliente ideal que usó
  offer_at?: string | null // la landing: fecha de la oferta que usó
}
