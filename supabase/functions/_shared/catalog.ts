// Catálogo de problemas del empresario y la solución con IA que MaestrIA propone para cada uno.
// Archivo compartido: lo usan la Edge Function (prompts) y el frontend (alias @shared). Sin APIs de Deno ni del navegador.
interface ProblemDef {
  id: string
  title: string
  tagline: string
  solution: string // "Solución: qué hace → resultado"
}

export const PROBLEMS: ProblemDef[] = [
  { id: 'captacion', title: 'Captación (ads + IA)', tagline: 'Depender de que lleguen clientes', solution: 'Captación: campañas de anuncios optimizadas con IA → de esperar clientes a atraerlos cada semana' },
  { id: 'landing', title: 'Landing Pages', tagline: 'Tu web es tu local digital', solution: 'Landing pages: una web clara que genera confianza y convierte visitas en contactos → de depender del boca a boca a captar también online' },
  { id: 'captacion_leads', title: 'Captación de Leads', tagline: 'Sin leads nuevos, el negocio muere', solution: 'Captación de leads: formularios y lead magnets automáticos → más contactos nuevos cada día sin esfuerzo' },
  { id: 'atencion_leads', title: 'Atención a Leads', tagline: 'Lead frío = venta perdida', solution: 'Atención inmediata: asistente de IA 24/7 que responde y cualifica en segundos → de contestar en horas a contestar al momento' },
  { id: 'seguimientos', title: 'Seguimientos y Recordatorios', tagline: 'El dinero está en el seguimiento', solution: 'Seguimiento automático: mensajes y recordatorios en el momento justo → de olvidar contactos a convertirlos en clientes' },
  { id: 'ltv', title: 'Lifetime Value (LTV)', tagline: 'Maximizar valor por cliente', solution: 'Más valor por cliente: ofertas personalizadas según lo que ya compró → de vender una vez a que cada cliente compre más' },
  { id: 'fidelizacion', title: 'Fidelización', tagline: 'Cliente feliz = cliente que vuelve', solution: 'Fidelización: recordatorios automáticos y programa de referidos → de clientes que se van a clientes que vuelven' },
  { id: 'ofertas', title: 'Ofertas y Comunicación', tagline: 'Tu base de datos es oro', solution: 'Comunicación: campañas automáticas por email y WhatsApp a la base de clientes → de una base de datos olvidada a ventas extra cada mes' },
  { id: 'upsells', title: 'Upsells / Cross-sells', tagline: 'Más valor por cliente = más rentabilidad', solution: 'Ventas adicionales: la IA detecta cuándo ofrecer algo más → de ticket bajo a sacar más de cada venta' },
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
