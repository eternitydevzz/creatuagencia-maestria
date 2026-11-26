import type { CustomProblem } from '@shared/catalog'
import type { DeliverableMeta } from '@shared/signature'
import type { AgentConfig } from '@shared/agent'
import type { Currency } from '@shared/currency'

export type { DeliverableMeta, AgentConfig }

export interface Profile {
  id: string; email: string; full_name: string | null
  role: 'student' | 'admin'; credits: number; created_at: string
  /** null = cuenta registrada que todavía no aprobó un administrador (sin créditos ni acceso al mapa). */
  approved_at: string | null; phone: string | null
}
export interface Metrics { leads?: number; conversion?: number; ticket?: number; ad_spend?: number }
export interface Pricing { mode?: 'aggressive' | 'premium'; currency?: Currency }

/** Valor JSON genérico: el cliente ideal y la oferta se pintan de forma genérica (ver lib/tree.ts). */
export type Json = string | number | boolean | null | Json[] | { [k: string]: Json }
export type JsonObject = { [k: string]: Json }

// ---- landing de la agencia
export interface AgencyContact { whatsapp?: string; email?: string }

/** Landing premium: la página de Jose (eternity-agency/index.html) como plantilla; la IA solo escribe estos textos.
 *  Se pinta con lib/premiumSite/render.ts. Las cantidades van en los comentarios (las exige el prompt). */
export type Accent = 'cian' | 'verde' | 'violeta' | 'ambar' | 'coral'
export interface PremiumSite {
  plantilla: 'premium'
  acento: Accent
  meta: { title: string; description: string }
  nav_cta: string
  hero: { chip: string; titulo: string; titulo_destacado: string; subtitulo: string; cta: string; cta_secundario: string; datos: Array<{ cifra: string; texto: string }> } // datos: 3
  marquee: { acciones: string[]; rasgos: string[] } // 4 y 4
  manifiesto: { etiqueta: string; texto: string; destacado: string }
  demo: {
    titulo: string; titulo_destacado: string; intro: string; pasos: Array<{ titulo: string; texto: string }> // pasos: 4
    negocio: string; asistente: string
    chat: Array<{ de: 'cliente' | 'agente'; texto: string; hora: string; huecos?: string[] }> // 5-7 mensajes
    confirmacion: { titulo: string; detalle: string }
  }
  servicios: { titulo: string; titulo_destacado: string; intro: string; items: Array<{ titulo: string; texto: string }>; etiquetas: string[] } // items 6, etiquetas 4
  proceso: { titulo: string; titulo_destacado: string; pasos: Array<{ plazo: string; titulo: string; texto: string }> } // 4
  resultados: { titulo: string; titulo_destacado: string; nota: string; cifras: Array<{ valor: number; prefijo?: string; sufijo?: string; decimales?: number; texto: string }> } // 4
  faq: Array<{ pregunta: string; respuesta: string }> // 6
  contacto: { titulo: string; titulo_destacado: string; texto: string; ventajas: string[]; cta: string } // ventajas 3 (una es la garantía)
  footer: string
  _meta?: DeliverableMeta
}
export interface AgencySite {
  _meta?: DeliverableMeta
  /** Dirección visual con la que se pinta la landing (ver lib/agencySite.ts). Opcional: si no viene, se
   *  deduce de forma determinista del nombre de la agencia, así que las landings ya generadas siguen funcionando. */
  direccion?: string
  /** Página ya hecha (modo directo): si viene, se muestra y se descarga tal cual en lugar de la plantilla. */
  html?: string
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
  /** Contenido de Instagram (forma de AgencyContent); {} hasta que se genera. */
  agency_content: JsonObject
  /** Anuncios de Meta (forma de AgencyAds); {} hasta que se genera. */
  agency_ads: JsonObject
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
  /** Link público de la demo (…/d/<código>) y su vencimiento; null si no está compartida. */
  share_token?: string | null; share_expires_at?: string | null
}

/** Lo mínimo de un proyecto para saber cuántos pasos lleva hecho (las listas no descargan los entregables enteros). */
export interface Progress {
  selected_problems: string[]; selected_nichos: string[]; business_metrics: Metrics
  has_ideal: boolean; has_offer: boolean; has_site: boolean; has_content: boolean; has_ads: boolean; has_agent: boolean; has_demo: boolean; has_whatsapp: boolean; visited_sections: number[]
}
export interface RoadmapSummary extends Progress {
  id: string; project_name: string; agency_name: string | null; status: Roadmap['status']; updated_at: string
}

/** Campos que el alumno edita directamente (el resto los escribe la IA en el servidor). */
export type EditablePatch = Partial<Pick<Roadmap,
  'agency_name' | 'selected_problems' | 'custom_problem_descriptions' | 'selected_nichos' | 'business_metrics' |
  'pricing_settings' | 'agency_contact' | 'current_section' | 'visited_sections' | 'status' | 'project_name'>>

export type GenerationKind = 'custom_problem' | 'new_niches' | 'ideal_client' | 'agency_offer' | 'agency_site' | 'agency_content' | 'agency_ads' | 'agent' | 'demo_agent'

/** Contenido de Instagram para conseguir los primeros clientes (paso "Tu contenido"). Lo escribe la IA en el servidor. */
/** Anuncios de Meta para conseguir los primeros clientes (paso "Tus anuncios"). Lo escribe la IA en el servidor. */
export interface AgencyAds {
  anuncios: Array<{ angulo: string; texto_principal: string; titular: string; descripcion: string; boton: string }> // 3
  /** Historia de 30-40 s (faceless): gancho + guion (una frase por línea) + cierre. problema/insight/solucion: formato anterior. */
  /** Ya no se generan (Jose, 2026-11-26): los 3 anuncios valen como guion hablado. Solo en anuncios generados antes. */
  videos?: Array<{ titulo: string; gancho: string; problema?: string; insight?: string; solucion?: string; guion?: string; cierre: string; texto_pantalla?: string[] }> // 2
  publico: { ubicacion: string; edad: string; intereses: string[]; comportamientos: string[]; notas: string }
  _meta?: DeliverableMeta
}

export interface AgencyContent {
  /** Historia de 30-40 s (faceless): gancho + guion (una frase por línea) + cierre. problema/insight/solucion y desarrollo: formatos anteriores. */
  reels: Array<{ titulo: string; formato?: string; gancho: string; guion?: string; problema?: string; insight?: string; solucion?: string; desarrollo?: string; cierre: string; texto_pantalla: string[]; caption: string; palabra_clave: string }> // 5
  bio: string
  carruseles: Array<{ titulo: string; diapositivas: string[]; caption: string }> // 3, 6-8 diapositivas
  _meta?: DeliverableMeta
}
