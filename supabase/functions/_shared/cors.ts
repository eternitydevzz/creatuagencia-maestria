// ALLOWED_ORIGIN admite uno o varios dominios separados por comas (p. ej. producción y la preview de una rama), o '*'.
const ALLOWED = Deno.env.get('ALLOWED_ORIGIN') ?? '*'

/** Dominio que se devuelve en Access-Control-Allow-Origin: el que pide la petición si está permitido; si no, el primero de la lista. */
export function allowOrigin(origin: string | null, allowed: string): string {
  const list = allowed.split(',').map((o) => o.trim()).filter(Boolean)
  if (list.includes('*')) return '*'
  return origin && list.includes(origin) ? origin : (list[0] ?? '*')
}

const BASE = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
}

/** Cabeceras CORS por defecto (sin conocer la petición): `withCors` las corrige con el dominio que corresponde. */
export const corsHeaders: Record<string, string> = { 'Access-Control-Allow-Origin': allowOrigin(null, ALLOWED), ...BASE }

/** Envuelve el handler de una función: responde al OPTIONS y pone en cada respuesta el dominio permitido que pidió la petición. */
export function withCors(handler: (req: Request) => Response | Promise<Response>, allowed: string = ALLOWED) {
  return async (req: Request): Promise<Response> => {
    const headers = { ...BASE, 'Access-Control-Allow-Origin': allowOrigin(req.headers.get('Origin'), allowed) }
    if (req.method === 'OPTIONS') return new Response('ok', { headers })
    const res = await handler(req)
    const out = new Headers(res.headers)
    for (const [k, v] of Object.entries(headers)) out.set(k, v)
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out })
  }
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}
