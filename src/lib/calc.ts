import type { Metrics } from './types'

export const eur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(n))

/** Lo que gana hoy el cliente y lo que ganaría atendiendo y siguiendo bien cada consulta (estimación conservadora).
 *  Mejora de conversión en puntos porcentuales: +2 por problema resuelto, con un tope de +8. */
export function impact(m: Metrics, problemCount: number) {
  const leads = Math.max(0, m.leads ?? 0); const conv = Math.max(0, m.conversion ?? 0); const ticket = Math.max(0, m.ticket ?? 0)
  const uplift = Math.min(8, Math.max(1, problemCount) * 2)
  const withAi = Math.min(100, conv + uplift)
  const current = leads * (conv / 100) * ticket
  const projected = leads * (withAi / 100) * ticket
  return { uplift, withAi, current, projected, extra: Math.max(0, projected - current) }
}
