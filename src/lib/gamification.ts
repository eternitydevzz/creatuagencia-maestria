import { Bot, Calculator, Gem, Globe, MessageCircle, Target, UserCheck, Users, type LucideIcon } from 'lucide-react'
import type { Progress, Roadmap } from './types'

interface SectionDef { id: number; title: string; icon: LucideIcon; heading: string; description: string }

/** El mapa: pasos de preguntas que alimentan los entregables (cliente ideal → oferta → landing) y la secretaria virtual que se enseña a los clientes.
 *  Aquí está todo lo de cada paso (nombre, icono, cabecera); la pantalla de cada uno se enlaza en RoadmapPage con el mismo id. */
export const SECTIONS = [
  { id: 1, title: 'Problemas que resuelves', icon: Target, heading: 'Detectar problemas', description: '¿Qué problemas del embudo vas a resolver a tus clientes con IA? Elige hasta 4: definen tu oferta.' },
  { id: 2, title: 'Tu nicho', icon: Users, heading: 'Tu agencia y tu nicho', description: 'A quién le vas a vender. Cuanto más concreto sea el nicho, más fácil es escribir una oferta y una web que conviertan.' },
  { id: 3, title: 'Tu cliente en números', icon: Calculator, heading: 'Tu cliente en números', description: 'Los números de un negocio típico de tu nicho. Con ellos la IA calcula cuánto pierde tu cliente y pone un precio que tenga sentido. Si no los sabes, pon una estimación.' },
  { id: 4, title: 'Cliente ideal', icon: UserCheck, heading: 'Tu cliente ideal', description: 'Quién es exactamente, qué le duele en sus palabras, cuánto pierde y dónde encontrarlo. Es la base de tu oferta y de tu landing.' },
  { id: 5, title: 'Tu oferta', icon: Gem, heading: 'Tu oferta irresistible', description: 'Promesa, mecanismo, precio anclado en lo que pierde tu cliente, garantía y una oferta piloto para conseguir tus primeros clientes sin casos de éxito.' },
  { id: 6, title: 'Tu landing', icon: Globe, heading: 'Tu landing de venta', description: 'Una web premium con tu oferta, lista para publicar. Los botones llevan a tu WhatsApp o a tu email.' },
  { id: 7, title: 'Tu agente', icon: Bot, heading: 'Tu agente de WhatsApp', description: 'Una secretaria virtual para un negocio típico de tu nicho: responde, cualifica y agenda a cualquier hora. Es lo que enseñas a tus clientes para que vean el resultado antes de comprar.' },
  { id: 8, title: 'Probar el agente', icon: MessageCircle, heading: 'Pruébalo como si fueras un cliente', description: 'Un WhatsApp de prueba para hablar con tu agente. Intenta romperlo: pregúntale precios, pídele cita, escríbele con faltas.' },
] as const satisfies ReadonlyArray<SectionDef>

export type SectionId = (typeof SECTIONS)[number]['id']

const filled = (o: object | null | undefined) => !!o && Object.keys(o).length > 0

/** Proyecto completo → lo mínimo para calcular el progreso (los listados ya lo traen así). */
export const progressOf = (r: Roadmap): Progress => ({
  selected_problems: r.selected_problems, selected_nichos: r.selected_nichos, business_metrics: r.business_metrics,
  has_ideal: filled(r.ideal_client), has_offer: filled(r.agency_offer?.oferta as object | undefined), has_site: filled(r.agency_site),
  has_agent: !!r.agents?.some((a) => a.source === 'niche'), visited_sections: r.visited_sections,
})

/** Una sección cuenta como completada cuando el alumno ha hecho lo esencial de ella. */
export function isSectionDone(p: Progress, id: number): boolean {
  switch (id) {
    case 1: return p.selected_problems.length > 0
    case 2: return p.selected_nichos.length > 0
    case 3: return (p.business_metrics.leads ?? 0) > 0 && (p.business_metrics.ticket ?? 0) > 0
    case 4: return p.has_ideal
    case 5: return p.has_offer
    case 6: return p.has_site
    case 7: return p.has_agent
    case 8: return p.has_agent && p.visited_sections.includes(8) // probar = haber abierto el chat con un agente creado
    default: return false
  }
}

export const completedCount = (p: Progress) => SECTIONS.filter((s) => isSectionDone(p, s.id)).length

const LEVELS = [
  { level: 1, name: 'Aprendiz', min: 0 },
  { level: 2, name: 'Explorador', min: 200 },
  { level: 3, name: 'Constructor', min: 500 },
  { level: 4, name: 'Estratega', min: 900 },
  { level: 5, name: 'Maestro', min: 1400 },
]

/** XP = 100 por sección completada + 20 por generación con IA exitosa. Es cosmético y se deriva de datos reales. */
export function computeXp(projects: Progress[], generations: number): number {
  return projects.reduce((n, p) => n + completedCount(p), 0) * 100 + generations * 20
}

export function levelFor(xp: number) {
  const cur = [...LEVELS].reverse().find((l) => xp >= l.min) ?? LEVELS[0]
  const next = LEVELS.find((l) => l.min > cur.min)
  return { ...cur, next, progress: next ? (xp - cur.min) / (next.min - cur.min) : 1 }
}
