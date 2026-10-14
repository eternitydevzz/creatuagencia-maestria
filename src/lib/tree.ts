// El cliente ideal y la oferta son JSON con estructura variable: se pintan y se exportan de forma genérica,
// con etiquetas en español para las claves conocidas.
import type { Json, JsonObject } from './types'

const LABELS: Record<string, string> = {
  // cliente ideal
  resumen: 'En una frase', avatar: 'Avatar', dia_a_dia: 'Su día a día', perfil: 'Perfil', quien: 'Quién es',
  tamano_negocio: 'Tamaño del negocio', facturacion: 'Facturación', como_capta_hoy: 'Cómo capta clientes hoy', nivel_digital: 'Nivel digital',
  herramientas: 'Herramientas que usa', coste_del_problema: 'Lo que le cuesta el problema', dolores: 'Dolores (en sus palabras)',
  deseos: 'Lo que quiere', su_lenguaje: 'Su lenguaje (úsalo en tu oferta y tu web)', momentos_de_compra: 'Cuándo está listo para comprar',
  senales_compra: 'Señales de que es buen cliente', red_flags: 'Señales para descartarlo', donde_esta: 'Dónde encontrarlo',
  preguntas_cualificacion: 'Preguntas para saber si encaja',
  // oferta
  oferta: 'Oferta principal', nombre: 'Nombre', para_quien: 'Para quién', promesa: 'Promesa', mecanismo: 'Mecanismo', incluye: 'Qué incluye',
  entregable: 'Entregable', que_resuelve: 'Qué resuelve', valor_percibido: 'Valor percibido', garantia: 'Garantía', precio: 'Precio',
  setup: 'Puesta en marcha', mensual: 'Mensual', valor_total_percibido: 'Valor total percibido', justificacion: 'Por qué este precio',
  bonos: 'Bonos', urgencia: 'Urgencia', pitch_30s: 'Pitch de 30 segundos', objeciones: 'Objeciones', objecion: 'Objeción', respuesta: 'Respuesta',
  oferta_piloto: 'Oferta piloto (primeros clientes)', que_incluye: 'Qué incluye', duracion: 'Duración', paso_a_principal: 'Paso a la oferta principal',
  como_proponerla: 'Cómo proponerla', escalera: 'Escalera de ofertas', nivel: 'Nivel', numeros_agencia: 'Números de tu agencia',
  coste_entrega_mensual: 'Coste de entrega al mes', margen_por_cliente: 'Margen por cliente', clientes_para_5000_mes: 'Clientes para llegar a 5000 al mes',
  // agente
  negocio: 'Negocio de ejemplo', rubro: 'Rubro', descripcion: 'Descripción', ubicacion: 'Dirección', horario: 'Horario', telefono: 'Teléfono',
  web: 'Web', zona_horaria: 'Zona horaria', servicios: 'Servicios y precios', secretaria: 'La secretaria', tono: 'Tono', saludo: 'Saludo',
  politicas: 'Políticas', faq: 'Preguntas frecuentes', pregunta: 'Pregunta', datos_cita: 'Datos que pide para agendar',
}
// Postgres (jsonb) guarda las claves en su propio orden, así que el orden de lectura se fija aquí.
// Las claves que no aparezcan van al final, en el orden en que llegan. Las que empiezan por _ (metadatos internos) no se muestran.
const ORDER = [
  'negocio', 'rubro', 'descripcion', 'ubicacion', 'horario', 'telefono', 'web', 'zona_horaria', 'servicios', 'secretaria', 'tono', 'saludo', 'politicas', 'faq', 'pregunta', 'datos_cita',
  'resumen', 'avatar', 'oferta', 'nivel', 'nombre', 'dia_a_dia', 'promesa', 'mecanismo',
  'perfil', 'quien', 'tamano_negocio', 'facturacion', 'como_capta_hoy', 'nivel_digital', 'herramientas',
  'coste_del_problema', 'dolores', 'deseos', 'su_lenguaje', 'momentos_de_compra',
  'incluye', 'que_incluye', 'entregable', 'que_resuelve', 'valor_percibido', 'para_quien', 'garantia',
  'precio', 'setup', 'mensual', 'valor_total_percibido', 'justificacion', 'duracion', 'bonos', 'urgencia', 'pitch_30s',
  'objeciones', 'objecion', 'respuesta', 'senales_compra', 'red_flags', 'donde_esta', 'preguntas_cualificacion',
  'paso_a_principal', 'como_proponerla', 'oferta_piloto', 'escalera',
  'numeros_agencia', 'coste_entrega_mensual', 'margen_por_cliente', 'clientes_para_5000_mes',
]
const rank = (k: string) => { const i = ORDER.indexOf(k); return i === -1 ? ORDER.length : i }
/** Entradas de un objeto en orden de lectura. */
export const ordered = (o: JsonObject) => Object.entries(o).filter(([k]) => !k.startsWith('_')).sort(([a], [b]) => rank(a) - rank(b))

/** Texto no vacío o undefined. */
export const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined)

export const label = (k: string) => LABELS[k] ?? k.replace(/_/g, ' ').replace(/^\p{L}/u, (c) => c.toUpperCase())

const TITLE_KEYS = ['titulo', 'nombre', 'objecion', 'entregable']
export const isObject = (v: Json): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v)

/** Título de una tarjeta (elemento de un array de objetos) y el resto de campos. */
export function itemTitle(o: JsonObject, i: number): { title: string; rest: JsonObject } {
  const rest = { ...o }
  const k = TITLE_KEYS.find((x) => typeof o[x] === 'string' && (o[x] as string).length <= 160)
  if (k) delete rest[k]
  return { title: k ? String(o[k]) : `${i + 1}`, rest }
}

/** Exporta un bloque a Markdown (copiar y descargar). */
export function treeToText(v: Json | undefined, k?: string, depth = 0): string {
  if (v === null || v === undefined || v === '') return ''
  const h = '#'.repeat(Math.min(6, depth + 2))
  if (typeof v !== 'object') return k ? `**${label(k)}:** ${v}` : String(v)
  const head = k ? `${h} ${label(k)}\n\n` : ''
  if (Array.isArray(v)) {
    if (v.every((x) => !isObject(x))) return head + v.map((x) => `- ${x}`).join('\n')
    return head + v.map((x, i) => { const { title, rest } = itemTitle(x as JsonObject, i); return `${'#'.repeat(Math.min(6, depth + 3))} ${title}\n\n${treeToText(rest, undefined, depth + 1)}` }).join('\n\n')
  }
  return head + ordered(v).map(([kk, vv]) => treeToText(vv, kk, depth + 1)).filter(Boolean).join('\n\n')
}
