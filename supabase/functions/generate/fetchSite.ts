// Descarga la web de un negocio ajeno para crear su demo. Es la parte delicada de la función: el alumno decide la URL, así que
// hay que impedir que la función se use para llegar a redes internas (SSRF). Defensas:
//   · solo http/https en los puertos 80 y 443, sin usuario ni contraseña en la URL
//   · se resuelve el dominio y se rechaza si apunta a una IP privada, de bucle local, de enlace local o de metadatos de la nube
//   · las redirecciones se siguen a mano (máx. 3) y cada salto se valida igual
//   · tiempo máximo, tamaño máximo y solo HTML
// Limitación conocida: entre la comprobación del DNS y la conexión un dominio malicioso podría cambiar de IP (DNS rebinding).
// La función corre en la infraestructura de Supabase, sin acceso a nuestras redes privadas, y la respuesta nunca se devuelve en bruto.
export class FetchError extends Error {
  constructor(public code: 'url_invalid' | 'url_blocked' | 'url_unreachable' | 'url_not_html', message: string) { super(message) }
}

const MAX_BYTES = 1_500_000
const TIMEOUT_MS = 8_000
const TOTAL_MS = 20_000 // presupuesto para todas las páginas de una misma demo (la función aún no ha empezado a responder)
const MAX_REDIRECTS = 3
const MAX_TEXT = 14_000
// SOLO PRUEBAS: dominios que se pueden descargar aunque resuelvan a IP privada (p. ej. host.docker.internal con el servidor simulado)
const ALLOW_HOSTS = (Deno.env.get('FETCH_ALLOW_HOSTS') ?? '').split(',').map((h) => h.trim().toLowerCase()).filter(Boolean)

function privateV4(ip: string): boolean {
  const p = ip.split('.').map(Number)
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = p
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 192 && b === 0 && p[2] === 0) || (a === 198 && (b === 18 || b === 19))
}
function privateV6(ip: string): boolean {
  const s = ip.toLowerCase()
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return privateV4(mapped[1])
  return s === '::' || s === '::1' || /^f[cd]/.test(s) || /^fe[89ab]/.test(s) || s.startsWith('ff') || s.startsWith('64:ff9b') || s.startsWith('2001:db8')
}
const isIp = (h: string) => /^\d+\.\d+\.\d+\.\d+$/.test(h) || h.includes(':')

async function assertPublic(url: URL): Promise<void> {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new FetchError('url_invalid', 'Solo se admiten direcciones http o https')
  if (url.username || url.password) throw new FetchError('url_invalid', 'La dirección no puede llevar usuario ni contraseña')
  if (url.port && url.port !== '80' && url.port !== '443') {
    if (!ALLOW_HOSTS.includes(url.hostname.toLowerCase())) throw new FetchError('url_blocked', 'Puerto no permitido')
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (ALLOW_HOSTS.includes(host)) return
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localdomain') || (!host.includes('.') && !host.includes(':')))
    throw new FetchError('url_blocked', 'Dirección no permitida')
  if (isIp(host)) {
    if (host.includes(':') ? privateV6(host) : privateV4(host)) throw new FetchError('url_blocked', 'Dirección no permitida')
    return
  }
  const ips: string[] = []
  for (const type of ['A', 'AAAA'] as const) {
    try { ips.push(...(await Deno.resolveDns(host, type))) } catch { /* sin registros de este tipo */ }
  }
  if (!ips.length) throw new FetchError('url_unreachable', 'No se encuentra esa web')
  if (ips.some((ip) => (ip.includes(':') ? privateV6(ip) : privateV4(ip)))) throw new FetchError('url_blocked', 'Dirección no permitida')
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value); size += value.length
  }
  try { await reader.cancel() } catch { /* ya terminado */ }
  const all = new Uint8Array(Math.min(size, MAX_BYTES))
  let off = 0
  for (const c of chunks) { const part = c.subarray(0, Math.max(0, all.length - off)); all.set(part, off); off += part.length }
  return new TextDecoder('utf-8', { fatal: false }).decode(all)
}

/** Descarga una página HTML siguiendo las redirecciones con validación en cada salto. */
export async function fetchHtml(input: string, deadline = Date.now() + TOTAL_MS): Promise<{ html: string; url: URL }> {
  let url: URL
  try { url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`) } catch { throw new FetchError('url_invalid', 'La dirección no es válida') }
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url)
    const left = deadline - Date.now()
    if (left < 500) throw new FetchError('url_unreachable', 'La web tarda demasiado en responder')
    let res: Response
    try {
      res = await fetch(url, {
        redirect: 'manual', signal: AbortSignal.timeout(Math.min(TIMEOUT_MS, left)),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MaestrIA/1.0)', Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'es,en;q=0.8' },
      })
    } catch { throw new FetchError('url_unreachable', 'No se pudo abrir esa web') }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) throw new FetchError('url_unreachable', 'La web redirige a ninguna parte')
      try { url = new URL(loc, url) } catch { throw new FetchError('url_unreachable', 'Redirección inválida') }
      await res.body?.cancel()
      continue
    }
    if (!res.ok) { await res.body?.cancel(); throw new FetchError('url_unreachable', `La web respondió con error ${res.status}`) }
    const type = res.headers.get('content-type') ?? ''
    if (!/text\/html|application\/xhtml/i.test(type)) { await res.body?.cancel(); throw new FetchError('url_not_html', 'Esa dirección no es una página web') }
    return { html: await readCapped(res), url }
  }
  throw new FetchError('url_unreachable', 'Demasiadas redirecciones')
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&euro;': '€' }
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|apos|nbsp|euro|#39);/g, (m) => ENTITIES[m] ?? m).replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))

/** HTML → texto plano útil: título, descripción, datos estructurados (JSON-LD), enlaces de contacto y el texto visible. */
export function htmlToText(html: string): string {
  const meta = (name: string) => decode((html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')) ?? [])[1] ?? '')
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1] ?? '').trim()
  const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1].replace(/\s+/g, ' ').trim()).join('\n').slice(0, 3500)
  const contacts = [...new Set([...html.matchAll(/href=["'](tel:[^"']+|mailto:[^"']+)["']/gi)].map((m) => decode(m[1])))].slice(0, 6).join(', ')
  const body = decode(
    html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<(script|style|noscript|svg|iframe|template)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)\s*>|<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '),
  ).replace(/[ \t\f\v]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{2,}/g, '\n').trim()
  return [title && `Título: ${title}`, meta('description') && `Descripción: ${meta('description')}`, contacts && `Contacto: ${contacts}`, ld && `Datos estructurados: ${ld}`, body].filter(Boolean).join('\n')
}

const SUBPAGE = /servici|tratamient|precio|tarifa|contact|horari|sobre|nosotros|clinica|equipo|about|services|pricing|contact/i

/** Texto de la web de un negocio: la portada y hasta 2 páginas internas útiles (servicios, precios, contacto…). */
export async function fetchSite(input: string): Promise<{ text: string; url: string }> {
  const deadline = Date.now() + TOTAL_MS
  const first = await fetchHtml(input, deadline)
  const parts = [htmlToText(first.html)]
  const links = [...new Set([...first.html.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)].flatMap((m) => {
    try {
      const u = new URL(decode(m[1]), first.url)
      if (u.hostname !== first.url.hostname || u.pathname === first.url.pathname || !SUBPAGE.test(`${u.pathname} ${m[2].replace(/<[^>]+>/g, ' ')}`)) return []
      if (/\.(pdf|jpe?g|png|webp|gif|svg|zip|docx?)$/i.test(u.pathname)) return []
      return [u.toString()]
    } catch { return [] }
  }))].slice(0, 2)
  for (const l of links) {
    try { parts.push(`--- ${l}\n${htmlToText((await fetchHtml(l, deadline)).html)}`) } catch { /* una subpágina que falla no impide la demo */ }
  }
  const text = parts.join('\n\n').slice(0, MAX_TEXT)
  if (text.replace(/\s/g, '').length < 80) throw new FetchError('url_not_html', 'La web no tiene texto que leer (¿se carga con JavaScript?). Rellena los datos a mano.')
  return { text, url: first.url.toString() }
}
