import { assertEquals } from 'jsr:@std/assert@1'
import { allowOrigin, withCors } from './cors.ts'

const LIST = 'https://a.app,https://b.app'

Deno.test('allowOrigin devuelve el origen si está en la lista', () => {
  assertEquals(allowOrigin('https://a.app', LIST), 'https://a.app')
  assertEquals(allowOrigin('https://b.app', ' https://a.app , https://b.app '), 'https://b.app')
})

Deno.test('allowOrigin devuelve el primero de la lista si el origen no está', () => {
  assertEquals(allowOrigin('https://x.app', LIST), 'https://a.app')
  assertEquals(allowOrigin(null, LIST), 'https://a.app')
})

Deno.test('allowOrigin con * deja pasar a cualquiera', () => {
  assertEquals(allowOrigin(null, '*'), '*')
  assertEquals(allowOrigin('https://x.app', '*'), '*')
})

const req = (method: string, origin: string) => new Request('https://fn.test/x', { method, headers: { Origin: origin } })

Deno.test('withCors responde al OPTIONS con el origen que pide, sin llamar a la función', async () => {
  let called = false
  const h = withCors(() => { called = true; return new Response('no') }, LIST)
  const res = await h(req('OPTIONS', 'https://b.app'))
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://b.app')
  assertEquals(res.headers.get('Vary'), 'Origin')
  assertEquals(called, false)
})

Deno.test('withCors pone el origen correcto en la respuesta de la función y conserva estado, cuerpo y cabeceras', async () => {
  const h = withCors(() => new Response('{"ok":1}', { status: 201, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://a.app' } }), LIST)
  const res = await h(req('POST', 'https://b.app'))
  assertEquals(res.status, 201)
  assertEquals(res.headers.get('Access-Control-Allow-Origin'), 'https://b.app')
  assertEquals(res.headers.get('Content-Type'), 'application/json')
  assertEquals(await res.text(), '{"ok":1}')
})
