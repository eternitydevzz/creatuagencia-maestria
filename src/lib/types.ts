import type { CustomProblem } from '@shared/catalog'
import type { DeliverableMeta } from '@shared/signature'
import type { AgentConfig } from '@shared/agent'
import type { Currency } from '@shared/currency'

export type { DeliverableMeta, AgentConfig }

export interface Profile {
  id: string; email: string; full_name: string | null
  role: 'student' | 'admin'; credits: number; created_at: string
}
export interface Metrics { leads?: number; conversion?: number; ticket?: number; ad_spend?: number }
export interface Pricing { mode?: 'aggressive' | 'premium'; currency?: Currency }

/** Valor JSON genérico: el cliente ideal y la oferta se pintan de forma genérica (ver lib/tree.ts). */
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json }
export type JsonObject = { [k: string]: Json }

// ---- landing de la agencia
export interface AgencyContact { whatsapp?: string; email?: string }
export interface AgencySite {
  _meta?: DeliverableMeta
  /** Dirección visual con la que se pinta la landing (ver lib/agencySite.ts). Opcional: si no viene, se
   *  deduce de forma determinista del nombre de la agencia, así que las landings ya generadas siguen funcionando. */
  direccion?: string
  meta?: { title?: string; description?: string }
  nav_cta?: string
  hero?: { eyebrow?: string; titulo?: string; subtitulo?: string; cta?: string; nota?: string; pruebas?: string[] }
  problema?: { titulo?: string; intro?: string; puntos?: Array<{ titulo?: string; texto?: string; coste?: string }> }
  solucion?: { titulo?: string; texto?: string; beneficios?: Array<{ titulo?: string; texto?: string }> }
  comparativa?: { titulo?: string; columnas?: string[]; filas?: Array<{ aspecto?: string; valores?: string[] }> }
  como_funciona?: { titulo?: string; pasos?: Array<{ titulo?: string; texto?: string; plazo?: string }> }
  para_quien?: { titulo?: string; si?: string[]; no?: string[] }
  oferta?: { titulo?: string; nombre?: string; incluye?: string[]; precio?: string; precio_anclaje?: string; garantia?: string; bonos?: string[]; escasez?: string; urgencia?: string; cta?: string }
  resultados?: { titulo?: string; nota?: string; cifras?: Array<{ cifra?: string; texto?: string }> }
  garantia?: { titulo?: string; texto?: string }
  nota_fundador?: { titulo?: string; texto?: string; firma?: string }
  faq?: Array<{ pregunta?: string; respuesta?: string }>
  cta_final?: { titulo?: string; texto?: string; cta?: string }
  footer?: string
}

export interface Roadmap {
  id: string; user_id: string; project_name: string; agency_name: string | null
  status: 'draft' | 'in_progress' | 'completed'
  selected_problems: string[]; custom_problem_descriptions: Record<string, CustomProblem>
  selected_nichos: string[]; business_metrics: Metrics; pricing_settings: Pricing
  ideal_client: JsonObject; agency_offer: JsonObject; agency_site: AgencySite; agency_contact: AgencyContact
  current_section: number; visited_sections: number[]; created_at: string; updated_at: string
  /** Agentes del proyecto (solo id y origen): sirve para saber si el paso del agente está hecho. */
  agents?: Array<{ id: string; source: Agent['source'] }>
  whatsapp_connections?: Array<{ id: string; status: WaStatus }>
}

export type WaStatus = 'starting' | 'scan_qr' | 'working' | 'failed' | 'stopped'

/** Número de WhatsApp vinculado a un agente (beta). */
export interface WaConnection { id: string; agent_id: string; status: WaStatus; phone: string | null; replies_today: number; replies_day: string; created_at: string }
export interface WaConversation { id: string; chat_id: string; contact_name: string | null; paused_until: string | null; last_message_at: string }
export interface WaMessage { id: number; role: 'user' | 'assistant' | 'owner'; content: string; created_at: string }
export interface Booking { id: string; name: string | null; phone: string | null; service: string | null; when_text: string | null; notes: string | null; created_at: string }

/** Secretaria virtual de un negocio (ficha + datos); las instrucciones del chat se construyen a partir de `config`. */
export interface Agent {
  id: string; roadmap_id: string; source: 'niche' | 'demo'; business_name: string; config: AgentConfig; created_at: string; updated_at: string
}

/** Lo mínimo de un proyecto para saber cuántos pasos lleva hecho (las listas no descargan los entregables enteros). */
export interface Progress {
  selected_problems: string[]; selected_nichos: string[]; business_metrics: Metrics
  has_ideal: boolean; has_offer: boolean; has_site: boolean; has_agent: boolean; has_demo: boolean; has_whatsapp: boolean; visited_sections: number[]
}
export interface RoadmapSummary extends Progress {
  id: string; project_name: string; agency_name: string | null; status: Roadmap['status']; updated_at: string
}

/** Campos que el alumno edita directamente (el resto los escribe la IA en el servidor). */
export type EditablePatch = Partial<Pick<Roadmap,
  'agency_name' | 'selected_problems' | 'custom_problem_descriptions' | 'selected_nichos' | 'business_metrics' |
  'pricing_settings' | 'agency_contact' | 'current_section' | 'visited_sections' | 'status' | 'project_name'>>

export type GenerationKind = 'custom_problem' | 'new_niches' | 'ideal_client' | 'agency_offer' | 'agency_site' | 'agent' | 'demo_agent'
