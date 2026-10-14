// Servidor simulado de la API de Anthropic (POST /v1/messages en streaming SSE) SOLO para pruebas locales.
// Devuelve respuestas de ejemplo según el prompt y registra cada petición en /tmp/mock-anthropic-requests.jsonl.
import http from 'node:http'
import fs from 'node:fs'
import { AGENT, DEMO, IDEAL, OFFER, SITE, SITE_HTML, SITE_SERVICES_HTML } from './mock-samples.mjs'

const LOG = '/tmp/mock-anthropic-requests.jsonl'
const PORT = Number(process.env.PORT ?? 8787)
const FAIL_NEXT = { count: 0 } // POST /__fail?n=2 hace fallar las próximas n peticiones (prueba de reembolso)
const BAD_NEXT = { count: 0 }  // POST /__bad?n=2 devuelve un JSON con la forma equivocada en las próximas n peticiones (prueba del reintento)
const SLOW_NEXT = { count: 0, ms: 0 } // POST /__slow?n=1&ms=3000 retrasa las próximas n respuestas (prueba del doble clic)

const J = (o) => JSON.stringify(o)
function reply(prompt) {
  const p = prompt
  if (/PROBLEMA PERSONALIZADO/.test(p)) return J({ description: 'El empresario pierde reservas porque nadie atiende fuera de horario', solution_label: 'Reservas 24/7', solution_description: 'Asistente que gestiona reservas por web y WhatsApp a cualquier hora → De perder reservas a llenar la agenda sin coger el teléfono' })
  if (/Propón 3 nichos/.test(p)) return '```json\n' + J([
    { nombre: 'Clínicas de fisioterapia con 2-4 boxes', oportunidad: 'Muchas consultas por WhatsApp y citas que se cancelan sin avisar', problema_principal: 'Huecos vacíos en la agenda', presupuesto_promedio: '300-500 €/mes' },
    { nombre: 'Academias de inglés para niños', oportunidad: 'Picos de matrícula en septiembre y enero con padres que preguntan a todas horas', problema_principal: 'Consultas sin contestar en temporada alta', presupuesto_promedio: '250-450 €/mes' },
    { nombre: 'Talleres mecánicos de barrio', oportunidad: 'Clientes que llaman mientras el mecánico está bajo un coche', problema_principal: 'Llamadas perdidas = citas perdidas', presupuesto_promedio: '200-400 €/mes' },
  ]) + '\n```'
  if (/Define el CLIENTE IDEAL de/.test(p)) return J(IDEAL)
  if (/Diseña la OFERTA de/.test(p)) return J(OFFER)
  if (/textos de la landing de venta/.test(p)) return J(SITE)
  if (/AGENTE DE DEMOSTRACIÓN para un negocio real/.test(p)) return J(DEMO)
  if (/AGENTE DE DEMOSTRACIÓN/.test(p)) return J(AGENT)
  return 'Respuesta de ejemplo del servidor simulado.'
}

// Respuesta de la secretaria (agent-chat): se reconoce por el system prompt. Varias burbujas separadas por línea en blanco.
function chatReply(system, messages) {
  const name = /Eres ([^,]+),/.exec(system)?.[1] ?? 'la secretaria'
  const last = String(messages.at(-1)?.content ?? '')
  if (/confirmo la cita/i.test(last)) return 'Perfecto, cita confirmada. Te esperamos.\n\n[[CITA {"nombre":"Ana","telefono":"600123123","servicio":"Limpieza dental","cuando":"viernes a las 10:00","notas":""}]]'
  if (/cuesta|precio/i.test(last)) return 'El bono mensual ilimitado son 89 €/mes, sin permanencia.\n\n¿Quieres que te reserve una clase de prueba gratis?'
  if (/olvida|instrucciones/i.test(last)) return 'Prefiero seguir ayudándote con Studio Pulso. ¿Te cuento los bonos?'
  return `¡Hola! Soy ${name}, de Studio Pulso.\n\n¿Te cuento cómo funcionan las clases o quieres reservar una de prueba?`
}

function plain(res, text, model) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'request-id': 'req_mock_' + Date.now() })
  res.end(J({ id: 'msg_mock', type: 'message', role: 'assistant', model, content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 120, output_tokens: Math.ceil(text.length / 4) } }))
}

function sse(res, text, model) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'request-id': 'req_mock_' + Date.now() })
  const ev = (type, data) => res.write(`event: ${type}\ndata: ${J({ type, ...data })}\n\n`)
  ev('message_start', { message: { id: 'msg_mock', type: 'message', role: 'assistant', model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 120, output_tokens: 1 } } })
  ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } })
  for (let i = 0; i < text.length; i += 400) ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: text.slice(i, i + 400) } })
  ev('content_block_stop', { index: 0 })
  ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: Math.ceil(text.length / 4) } })
  ev('message_stop', {})
  res.end()
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  // Páginas de prueba para la demo desde una URL (la función las descarga con FETCH_ALLOW_HOSTS=host.docker.internal)
  if (url.pathname === '/__site') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(SITE_HTML); return }
  if (url.pathname === '/__site/servicios') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(SITE_SERVICES_HTML); return }
  if (url.pathname === '/__json') { res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"a":1}'); return }
  if (url.pathname === '/__redirect') { res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data/' }).end(); return }
  if (url.pathname === '/__fail') { FAIL_NEXT.count = Number(url.searchParams.get('n') ?? 1); res.end('ok'); return }
  if (url.pathname === '/__bad') { BAD_NEXT.count = Number(url.searchParams.get('n') ?? 1); res.end('ok'); return }
  if (url.pathname === '/__slow') { SLOW_NEXT.count = Number(url.searchParams.get('n') ?? 1); SLOW_NEXT.ms = Number(url.searchParams.get('ms') ?? 2000); res.end('ok'); return }
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    if (!url.pathname.startsWith('/v1/messages')) { res.writeHead(404).end(); return }
    let b = {}; try { b = JSON.parse(body) } catch { /* vacío */ }
    fs.appendFileSync(LOG, J({ path: req.url, model: b.model, max_tokens: b.max_tokens, stream: b.stream, output_config: b.output_config, fallbacks: b.fallbacks, betas: req.headers['anthropic-beta'], thinking: b.thinking, tool_choice: b.tool_choice, temperature: b.temperature, n_messages: b.messages?.length, web: (String(b.messages?.[0]?.content).match(/<<<WEB\n([\s\S]*?)\nWEB>>>/) ?? [])[1], system_head: String(b.system).slice(0, 400), first_chars: String(b.messages?.[0]?.content).slice(0, 90), price_ref: /Precios de referencia calculados/.test(String(b.messages?.[0]?.content)), ideal_ctx: /CLIENTE IDEAL YA DEFINIDO/.test(String(b.messages?.[0]?.content)), offer_ctx: /OFERTA YA DEFINIDA/.test(String(b.messages?.[0]?.content)), has_meta: /_meta|"inputs"/.test(String(b.messages?.[0]?.content)), sys_usd: /\$100,000/.test(String(b.system)), sys_eur: /100\.000 €/.test(String(b.system)), euro_in_prompt: /€/.test(String(b.system) + String(b.messages?.[0]?.content)) }) + '\n')
    if (FAIL_NEXT.count > 0) { FAIL_NEXT.count--; res.writeHead(529, { 'Content-Type': 'application/json' }).end(J({ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } })); return }
    // El reintento por JSON inválido añade mensajes al final: la petición se identifica por el primero
    const last = b.messages?.[0]?.content
    const prompt = typeof last === 'string' ? last : J(last)
    const isChat = /secretaria virtual de/.test(String(b.system))
    let text = isChat ? chatReply(String(b.system), b.messages ?? []) : reply(prompt)
    if (!isChat && BAD_NEXT.count > 0) { BAD_NEXT.count--; text = J({ error: 'forma equivocada' }) }
    const delay = SLOW_NEXT.count > 0 ? (SLOW_NEXT.count--, SLOW_NEXT.ms) : 0
    setTimeout(() => (b.stream ? sse(res, text, b.model ?? 'mock') : plain(res, text, b.model ?? 'mock')), delay)
  })
}).listen(PORT, '0.0.0.0', () => console.log(`mock anthropic en :${PORT}`))
