// Cuánto puede cobrar el alumno por cada servicio según los números de un negocio típico de su nicho.
// Archivo compartido: lo usa el panel (deslizadores en directo) y la Edge Function (precios de referencia para la oferta y la landing),
// así que ambos dan siempre las mismas cifras. Sin APIs de Deno ni del navegador.
//
// Es una guía de mercado, no una verdad: los precios crecen con el tamaño del negocio (consultas × ticket, con raíz cuadrada para
// que un negocio 4 veces mayor no pague 4 veces más), con la inversión en anuncios (más gasto, más gestión) y con el modo elegido.

export interface PriceInput { leads: number; adSpend: number; ticket: number; mode: 'aggressive' | 'premium' }
export interface PriceLine { id: string; name: string; description: string; setup: number; monthly: number }
export interface PriceTable { lines: PriceLine[]; pack: { setup: number; monthly: number; savings: number }; size: number }

export const DEFAULTS = { leads: 150, adSpend: 500, ticket: 300, conversion: 20 }
export const LIMITS = { leads: [20, 1000], adSpend: [0, 5000], ticket: [30, 5000], conversion: [5, 60] } as const

const round = (n: number, step: number) => Math.max(step, Math.round(n / step) * step)

export function priceTable(i: PriceInput): PriceTable {
  const m = i.mode === 'premium' ? 1.35 : 0.8
  // "Tamaño" del negocio: sube despacio con lo que mueve al mes
  const size = Math.sqrt(Math.max(1, (i.leads * i.ticket) / 1000))
  const A = Math.max(0, i.adSpend)

  const lines: PriceLine[] = [
    { id: 'landing', name: 'Landing page de alta conversión', description: 'Una sola página que convierte visitas en consultas.', setup: round(m * (350 + 28 * size), 50), monthly: 0 },
    { id: 'whatsapp', name: 'Agente de WhatsApp 24/7', description: 'Atiende, cualifica y agenda a cualquier hora.', setup: round(m * (700 + 60 * size), 50), monthly: round(m * (120 + 12 * size + 0.05 * A), 10) },
    { id: 'followup', name: 'Seguimiento y reactivación', description: 'Recordatorios y mensajes que recuperan a quien no contestó.', setup: round(m * (350 + 30 * size), 50), monthly: round(m * (100 + 8 * size + 0.03 * A), 10) },
    { id: 'voice', name: 'Secretaria virtual por teléfono', description: 'Contesta las llamadas y agenda sin que nadie descuelgue.', setup: round(m * (1000 + 80 * size), 50), monthly: round(m * (180 + 14 * size), 10) },
    { id: 'ads', name: 'Pack de anuncios con IA', description: 'Creatividades y campañas listas para atraer consultas.', setup: round(m * (500 + 45 * size), 50), monthly: round(m * (250 + 0.18 * A), 10) },
  ]
  // El pack completo (landing + agente + seguimiento + anuncios) con un 15 % menos que sumar cada cosa
  const core = lines.filter((l) => ['landing', 'whatsapp', 'followup', 'ads'].includes(l.id))
  const setup = core.reduce((n, l) => n + l.setup, 0), monthly = core.reduce((n, l) => n + l.monthly, 0)
  const pack = { setup: round(setup * 0.85, 50), monthly: round(monthly * 0.85, 10), savings: Math.round((setup - setup * 0.85) + (monthly - monthly * 0.85) * 12) }
  return { lines, pack, size }
}

/** Cuántos clientes más al mes hacen falta para cubrir la cuota mensual del pack (el argumento de venta). */
export const clientsToPayBack = (monthly: number, ticket: number) => Math.max(1, Math.ceil(monthly / Math.max(1, ticket)))
