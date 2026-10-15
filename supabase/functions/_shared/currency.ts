// Moneda del proyecto y el mercado que lleva asociado. Archivo compartido: lo usan el panel (formato de las cifras y selector)
// y la Edge Function `generate` (los prompts de la IA). Sin APIs de Deno ni del navegador.
//
// La moneda se guarda en `pricing_settings.currency` del proyecto. Solo se guarda 'USD': el euro es el valor por defecto y
// no deja rastro, así que un proyecto antiguo, o uno que vuelve al euro, tiene exactamente la misma huella que antes y no
// sale como "desactualizado" sin motivo (la huella de signature.ts incluye pricing_settings).
//
// Elegir moneda elige también el mercado: euro = España (como siempre), dólar = Estados Unidos en español neutro. Las cifras
// NO se convierten: 300 € pasa a $300. Es una guía de mercado, y un tipo de cambio fijo quedaría desfasado.

export type Currency = 'EUR' | 'USD'
export const CURRENCIES: readonly Currency[] = ['EUR', 'USD']

/** Moneda de un `pricing_settings` cualquiera. Lo que no sea exactamente 'USD' es euro (entrada no fiable: viene del navegador). */
export function currencyOf(pricing: unknown): Currency {
  return pricing && typeof pricing === 'object' && (pricing as { currency?: unknown }).currency === 'USD' ? 'USD' : 'EUR'
}

/** `pricing_settings` con la moneda cambiada, sin tocar el resto. El euro se guarda como ausencia (ver arriba). */
export function withCurrency<T extends { currency?: Currency }>(pricing: T, currency: Currency): T {
  const { currency: _drop, ...rest } = pricing
  return (currency === 'USD' ? { ...rest, currency } : rest) as T
}

export interface Market {
  currency: Currency
  symbol: string
  /** "euros" / "dólares", para frases como "precios en euros". */
  name: string
  /** Etiqueta del selector. */
  label: string
  /** Importe tal y como se escribe en esa moneda: "60 €" / "$60". */
  fmt: (n: number | string) => string
  /** Cifras redondas que los prompts escriben a mano, ya con el separador de miles de cada mercado. */
  agencyYear: string
  nicheMonthly: string
  goalMonthly: string
  /** Descripción del mercado para los prompts. */
  language: string
  country: string
  phoneFormat: string
  cityHint: string
  timezone: string
  /** Regla extra sobre la zona horaria; vacía donde basta el ejemplo. */
  timezoneRule: string
}

const MARKETS: Record<Currency, Market> = {
  EUR: {
    currency: 'EUR', symbol: '€', name: 'euros', label: 'Euro (€)',
    fmt: (n) => `${n} €`,
    agencyYear: '100.000 €', nicheMonthly: '200-600 €/mes', goalMonthly: '3.000-5.000 €/mes',
    language: 'Español de España', country: 'España', phoneFormat: '6XX XXX XXX', cityHint: 'ciudad española',
    timezone: 'Europe/Madrid', timezoneRule: '',
  },
  USD: {
    currency: 'USD', symbol: '$', name: 'dólares', label: 'Dólar ($)',
    fmt: (n) => `$${n}`,
    agencyYear: '$100,000', nicheMonthly: '$200-$600/mes', goalMonthly: '$3,000-$5,000/mes',
    // Neutro: lo entiende cualquier hispanohablante de EEUU. Nada de "vosotros", "coger" ni "vale".
    language: 'Español neutro latinoamericano (sin "vosotros" ni giros de España)', country: 'Estados Unidos',
    // 555-01XX es el rango que EEUU reserva para teléfonos de ficción: nunca coincide con un número real.
    phoneFormat: '(XXX) 555-01XX', cityHint: 'ciudad de Estados Unidos',
    timezone: 'America/New_York',
    timezoneRule: '"zona_horaria": la zona IANA de la ciudad del negocio, escrita exactamente así (America/New_York, America/Chicago, America/Denver o America/Los_Angeles). Nunca una descripción.',
  },
}

export const marketOf = (currency: Currency): Market => MARKETS[currency]

/** Cifra con el formato de la moneda, para pantalla. Sin decimales. */
export function formatMoney(n: number, currency: Currency): string {
  const [locale, code] = currency === 'USD' ? ['en-US', 'USD'] : ['es-ES', 'EUR']
  return new Intl.NumberFormat(locale, { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(Math.round(n))
}
