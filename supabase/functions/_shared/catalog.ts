// Catálogo de problemas del empresario y la solución con IA que MaestrIA propone para cada uno.
// Archivo compartido: lo usan la Edge Function (prompts) y el frontend (alias @shared). Sin APIs de Deno ni del navegador.
interface ProblemDef {
  id: string
  title: string
  tagline: string
  solution: string // "Solución: qué hace → resultado"
  bullets: string[] // lo que incluye la solución (se muestra en el paso "Soluciones con IA")
}

export const PROBLEMS: ProblemDef[] = [
  { id: 'captacion', title: 'Captación (ads + IA)', tagline: 'Depender de que lleguen clientes', solution: 'Captación: campañas de anuncios optimizadas con IA → de esperar clientes a atraerlos cada semana', bullets: ['Anuncios que atacan el dolor real de tu cliente', 'Campañas listas para publicar en Meta y Google', 'Formulario que cualifica antes de agendar', 'Coste por cliente medido semana a semana'] },
  { id: 'landing', title: 'Landing Pages', tagline: 'Tu web es tu local digital', solution: 'Landing pages: una web clara que genera confianza y convierte visitas en contactos → de depender del boca a boca a captar también online', bullets: ['Una sola página que convierte visitas en consultas', 'Textos con las palabras de tu cliente', 'Botón directo a WhatsApp o a la agenda', 'Lista en minutos, sin programar'] },
  { id: 'captacion_leads', title: 'Captación de Leads', tagline: 'Sin leads nuevos, el negocio muere', solution: 'Captación de leads: formularios y lead magnets automáticos → más contactos nuevos cada día sin esfuerzo', bullets: ['Formularios y lead magnets que funcionan solos', 'Cada contacto entra ordenado en tu CRM', 'Aviso inmediato cuando llega uno nuevo', 'Sin depender de las redes sociales'] },
  { id: 'atencion_leads', title: 'Atención a Leads', tagline: 'Lead frío = venta perdida', solution: 'Atención inmediata: asistente de IA 24/7 que responde y cualifica en segundos → de contestar en horas a contestar al momento', bullets: ['Responde en segundos a cualquier hora', 'Entiende lo que pide y no repite preguntas', 'Califica el motivo de la consulta', 'Agenda directo en el calendario'] },
  { id: 'seguimientos', title: 'Seguimientos y Recordatorios', tagline: 'El dinero está en el seguimiento', solution: 'Seguimiento automático: mensajes y recordatorios en el momento justo → de olvidar contactos a convertirlos en clientes', bullets: ['Mensajes en el momento justo, sin recordarlo tú', 'Recordatorios que reducen las ausencias', 'Reactivación de quien dejó de contestar', 'Cada contacto con su siguiente paso'] },
  { id: 'ltv', title: 'Lifetime Value (LTV)', tagline: 'Maximizar valor por cliente', solution: 'Más valor por cliente: ofertas personalizadas según lo que ya compró → de vender una vez a que cada cliente compre más', bullets: ['Ofertas según lo que ya compró cada cliente', 'Aviso cuando toca renovar o repetir', 'Programas de recompra automáticos', 'Más ingresos sin más anuncios'] },
  { id: 'fidelizacion', title: 'Fidelización', tagline: 'Cliente feliz = cliente que vuelve', solution: 'Fidelización: recordatorios automáticos y programa de referidos → de clientes que se van a clientes que vuelven', bullets: ['Recordatorios de revisión y renovación', 'Programa de referidos que se gestiona solo', 'Seguimiento después de la compra', 'Reseñas pedidas en el momento oportuno'] },
  { id: 'ofertas', title: 'Ofertas y Comunicación', tagline: 'Tu base de datos es oro', solution: 'Comunicación: campañas automáticas por email y WhatsApp a la base de clientes → de una base de datos olvidada a ventas extra cada mes', bullets: ['Campañas por email y WhatsApp a tu base', 'Segmentación por lo que compró cada uno', 'Calendario de promociones automático', 'Resultados medidos por campaña'] },
  { id: 'upsells', title: 'Upsells / Cross-sells', tagline: 'Más valor por cliente = más rentabilidad', solution: 'Ventas adicionales: la IA detecta cuándo ofrecer algo más → de ticket bajo a sacar más de cada venta', bullets: ['La IA detecta cuándo ofrecer algo más', 'Sugerencias según el historial del cliente', 'Packs y mejoras en el punto de venta', 'Ticket medio al alza mes a mes'] },
]

export interface CustomProblem { description?: string; solution_label?: string; solution_description?: string }

/** Devuelve la línea de solución de un problema, ya sea del catálogo o personalizado. */
export function describeProblem(id: string, custom: Record<string, CustomProblem> = {}): string {
  if (id.startsWith('custom_') && custom[id]) {
    const c = custom[id]
    return `${c.solution_label ?? id}: ${c.solution_description ?? c.description ?? id}`
  }
  return PROBLEMS.find((p) => p.id === id)?.solution ?? id
}

export function problemLabel(id: string, custom: Record<string, CustomProblem> = {}): string {
  if (id.startsWith('custom_') && custom[id]?.solution_label) return custom[id].solution_label!
  return PROBLEMS.find((p) => p.id === id)?.title ?? id
}

/** Nombre corto de la solución ("Atención inmediata") y la frase de cambio ("de contestar en horas" → "contestar al momento"). */
export function solutionParts(id: string, custom: Record<string, CustomProblem> = {}): { label: string; from: string; to: string; bullets: string[] } {
  const line = describeProblem(id, custom)
  const label = line.includes(':') ? line.split(':')[0].trim() : problemLabel(id, custom)
  const after = line.includes('→') ? line.split('→').slice(1).join('→').trim() : ''
  const m = after.match(/^de (.+?) a (.+)$/i)
  const bullets = PROBLEMS.find((p) => p.id === id)?.bullets ?? []
  return { label, from: m?.[1] ?? '', to: m?.[2] ?? (after || ''), bullets }
}
