// Datos de ejemplo para las pruebas de la plantilla premium (no se usan en la app).
import type { PremiumSite } from '../types'

export const SITE: PremiumSite = {
  plantilla: 'premium',
  acento: 'cian',
  meta: { title: 'Agencia Norte · Asistentes de IA para fisioterapia', description: 'Atendemos por WhatsApp a los pacientes de tu clínica de fisioterapia.' },
  nav_cta: 'Pedir demo',
  hero: {
    chip: 'IA para clínicas de fisioterapia', titulo: 'Tu agenda de fisio,', titulo_destacado: 'llena sin coger el teléfono.',
    subtitulo: 'Un asistente que contesta por WhatsApp en segundos, agenda sesiones y recuerda citas.',
    cta: 'Quiero ver mi demo', cta_secundario: 'Ver la demo en vivo',
    datos: [{ cifra: '24/7', texto: 'También fines de semana' }, { cifra: '< 30 s', texto: 'Tiempo de respuesta' }, { cifra: '7 días', texto: 'Para estar en marcha' }],
  },
  marquee: { acciones: ['Agenda sesiones', 'Confirma citas', 'Recupera pacientes', 'Responde al momento'], rasgos: ['Sin permanencia', '24/7/365', 'Cero llamadas perdidas', 'Menos ausencias'] },
  manifiesto: { etiqueta: 'El problema', texto: 'Cada mensaje sin contestar es un paciente que reserva en otra clínica.', destacado: 'Tu asistente contesta siempre.' },
  demo: {
    titulo: 'Sábado, 22:10.', titulo_destacado: 'La sesión ya está agendada.', intro: 'Así atiende el asistente a un paciente nuevo.',
    pasos: [{ titulo: 'Entiende', texto: 'Detecta qué le pasa.' }, { titulo: 'Consulta', texto: 'Mira los huecos libres.' }, { titulo: 'Reserva', texto: 'Recoge los datos.' }, { titulo: 'Recuerda', texto: 'Envía el recordatorio.' }],
    negocio: 'Fisio Centro', asistente: 'Lucía',
    chat: [
      { de: 'cliente', texto: 'Hola, ¿tenéis hueco para una sesión esta semana?', hora: '22:10' },
      { de: 'agente', texto: 'Hola, soy Lucía, de Fisio Centro. Tengo estos huecos:', hora: '22:10', huecos: ['Lun 10:00', 'Mar 17:30', 'Jue 9:00'] },
      { de: 'cliente', texto: 'El martes a las 17:30', hora: '22:11' },
      { de: 'agente', texto: 'Hecho. ¿Me dices tu nombre?', hora: '22:11' },
      { de: 'cliente', texto: 'Ana Gil', hora: '22:11' },
      { de: 'agente', texto: 'Perfecto, Ana. Te escribo el lunes para recordártelo.', hora: '22:12' },
    ],
    confirmacion: { titulo: 'Sesión confirmada', detalle: 'Mar · 17:30 · Fisioterapia' },
  },
  servicios: {
    titulo: 'Un equipo que', titulo_destacado: 'no se toma descansos.', intro: 'Cada asistente aprende tus servicios, horarios y tono.',
    items: [
      { titulo: 'Recepción 24/7', texto: 'Contesta y agenda a cualquier hora.' }, { titulo: 'Recordatorios', texto: 'Menos huecos vacíos.' },
      { titulo: 'Reactivación', texto: 'Escribe a quien hace meses que no viene.' }, { titulo: 'Tratamientos', texto: 'Cualifica a quien pregunta por bonos.' },
      { titulo: 'Reseñas', texto: 'Pide reseñas tras cada sesión.' }, { titulo: 'Habla como tu clínica', texto: 'Con tu tono y tus palabras.' },
    ],
    etiquetas: ['Bonos', 'Suelo pélvico', 'Deportiva', 'Masaje'],
  },
  proceso: { titulo: 'En marcha en', titulo_destacado: '7 días.', pasos: [
    { plazo: 'Día 1', titulo: 'Diagnóstico', texto: 'Llamada de 30 minutos.' }, { plazo: 'Días 2-4', titulo: 'Entrenamiento', texto: 'Aprende tu clínica.' },
    { plazo: 'Días 5-6', titulo: 'Pruebas', texto: 'Tu equipo lo prueba.' }, { plazo: 'Día 7', titulo: 'Lanzamiento', texto: 'Empieza a atender.' },
  ] },
  resultados: { titulo: 'Más sesiones.', titulo_destacado: 'Menos huecos.', nota: 'Estimaciones del sector', cifras: [
    { valor: 30, prefijo: '+', sufijo: '%', texto: 'citas fuera de horario' }, { valor: 25, prefijo: '−', sufijo: '%', texto: 'ausencias' },
    { valor: 4.8, decimales: 1, sufijo: ' s', texto: 'de respuesta media' }, { valor: 3, sufijo: '/10', texto: 'pacientes que vuelven' },
  ] },
  faq: Array.from({ length: 6 }, (_, i) => ({ pregunta: `Pregunta ${i + 1}`, respuesta: `Respuesta ${i + 1}` })),
  contacto: { titulo: 'Haz que tu clínica', titulo_destacado: 'no pierda pacientes.', texto: 'Te enseñamos cómo contestaría tu asistente.', ventajas: ['Respuesta en 24 h', 'Demo con tu clínica', 'Si en 30 días no agenda 10 citas, no pagas'], cta: 'Quiero mi demo' },
  footer: 'Asistentes de IA para clínicas de fisioterapia.',
}
