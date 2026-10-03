// Cliente mínimo del servidor de WhatsApp (WAHA, https://waha.devlike.pro). Corre aparte (ver render.yaml / README) y solo lo llaman
// las Edge Functions: la clave y la dirección no llegan nunca al navegador.
const BASE = (Deno.env.get('WAHA_URL') ?? '').replace(/\/$/, '')
const KEY = Deno.env.get('WAHA_API_KEY') ?? ''

export const wahaConfigured = () => !!BASE && !!KEY

export async function waha(path: string, opts: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: { 'X-Api-Key': KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: AbortSignal.timeout(opts.timeoutMs ?? 15_000),
  })
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  return { status: res.status, data }
}

/** Estados de WAHA → los nuestros. */
export function mapStatus(s: unknown): 'starting' | 'scan_qr' | 'working' | 'failed' | 'stopped' {
  switch (s) {
    case 'WORKING': return 'working'
    case 'SCAN_QR_CODE': return 'scan_qr'
    case 'FAILED': return 'failed'
    case 'STOPPED': return 'stopped'
    default: return 'starting'
  }
}

/** "34600123456@c.us" → "+34600123456" */
export function phoneOf(id: unknown): string | null {
  const m = typeof id === 'string' ? id.match(/^(\d{6,20})(?::\d+)?@/) : null
  return m ? `+${m[1]}` : null
}

/** Configuración de la sesión: solo mensajes individuales (sin grupos, estados ni canales) y webhook firmado hacia wa-webhook. */
export function sessionConfig() {
  const url = Deno.env.get('WA_WEBHOOK_URL') ?? ''
  const secret = Deno.env.get('WA_WEBHOOK_SECRET') ?? ''
  return {
    client: { deviceName: 'MaestrIA', browserName: 'Chrome' },
    ignore: { status: true, groups: true, channels: true, broadcast: true },
    webhooks: [{
      url, events: ['message', 'message.any', 'session.status'], hmac: { key: secret },
      retries: { policy: 'constant', delaySeconds: 2, attempts: 5 },
    }],
  }
}
