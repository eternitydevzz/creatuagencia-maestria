import { assert, assertStringIncludes } from 'jsr:@std/assert@1'
import { agencyAds, agencyContent, agencySite, agencySitePremium, type Ctx } from './prompts.ts'

const ctx = (currency: 'usd' | 'eur'): Ctx => ({
  agencyName: 'Agencia Norte', nichos: ['clínicas de fisioterapia'], problems: ['atencion_leads'], custom: {},
  metrics: { leads: 120, ticket: 60 }, pricing: { mode: 'aggressive', currency },
  idealClient: { resumen: 'Dueño de clínica de fisio con 2-4 boxes', dolores: ['No contesto el WhatsApp a tiempo'] },
  agencyOffer: { oferta: { nombre: 'Agenda Llena en 30 días', urgencia: 'Solo 2 clínicas por semana' } },
})

Deno.test('agencySitePremium pide el JSON de la plantilla premium', () => {
  const p = agencySitePremium(ctx('usd'))
  for (const s of ['"plantilla": "premium"', '"demo"', '"chat"', 'cian | verde | violeta | ambar | coral', '"titulo_destacado"', '"marquee"', '"manifiesto"']) assertStringIncludes(p, s)
  assert(!p.includes('"direccion"'), 'no debe pedir la dirección visual vieja')
  assert(!p.includes('tech-blue'), 'no debe hablar de las direcciones viejas')
})

Deno.test('agencySitePremium usa el cliente ideal y la oferta del alumno', () => {
  const p = agencySitePremium(ctx('usd'))
  assertStringIncludes(p, 'CLIENTE IDEAL YA DEFINIDO')
  assertStringIncludes(p, 'OFERTA YA DEFINIDA')
  assertStringIncludes(p, 'Agenda Llena en 30 días')
})

Deno.test('agencySitePremium prohíbe testimonios inventados', () => {
  assertStringIncludes(agencySitePremium(ctx('eur')).toLowerCase(), 'testimonio')
})

Deno.test('agencySite (formato viejo) no cambia', () => {
  const p = agencySite(ctx('usd'))
  assertStringIncludes(p, 'tech-blue')
  assertStringIncludes(p, '"direccion"')
})

Deno.test('agencyContent pide 5 reels, bio y 3 carruseles para el dueño del nicho', () => {
  const p = agencyContent(ctx('usd'))
  for (const s of ['"reels"', '"bio"', '"carruseles"', '"gancho"', '"palabra_clave"', '3 segundos', 'Comenta', 'WhatsApp', 'clínicas de fisioterapia']) assertStringIncludes(p, s)
  assertStringIncludes(p, 'CLIENTE IDEAL YA DEFINIDO')
  assertStringIncludes(p, 'OFERTA YA DEFINIDA')
})

Deno.test('agencyContent: reels de 30-40 s faceless contados como una historia en segunda persona', () => {
  const p = agencyContent(ctx('eur'))
  for (const s of ['"guion"', '"cierre"', '30-40 segundos', 'faceless', 'voz en off', '100 palabras', 'segunda persona', 'una cifra']) assertStringIncludes(p, s)
  for (const s of ['"problema"', '"insight"', '"solucion"', '"desarrollo"']) assert(!p.includes(s), `el reel ya no se escribe por casillas (${s})`)
})

Deno.test('agencyContent en euros no habla de dólares ni de EE. UU.', () => {
  const p = agencyContent(ctx('eur'))
  assert(!p.includes('$'), 'no debe aparecer el símbolo $')
  assert(!p.includes('EE. UU.'), 'no debe hablar de EE. UU.')
})

Deno.test('agencyAds: texto de 4 líneas (dolor, problema, resultado, CTA) sin listas largas', () => {
  const p = agencyAds(ctx('usd'))
  for (const s of ['4 líneas', 'Dolor', 'Problema', 'Resultado', 'Haz clic aquí abajo y escríbenos', 'WhatsApp']) assertStringIncludes(p, s)
  for (const s of ['Qué te damos', 'Olvídate de', 'Estamos ayudando']) assert(!p.includes(s), `ya no debe pedir "${s}"`)
  for (const s of ['"anuncios"', '"videos"', '"publico"', '"texto_principal"', '"titular"', '"descripcion"', '"boton"', '"intereses"', '"comportamientos"']) assertStringIncludes(p, s)
})

Deno.test('agencyAds: vídeos de 30-40 s faceless contados como una historia en segunda persona', () => {
  const p = agencyAds(ctx('usd'))
  for (const s of ['"guion"', '"cierre"', '30-40 segundos', 'faceless', 'voz en off', 'segunda persona']) assertStringIncludes(p, s)
  for (const s of ['"problema"', '"insight"', '"solucion"']) assert(!p.includes(s), `el vídeo ya no se escribe por casillas (${s})`)
})

Deno.test('agencyAds: anuncios humanos, sin coletillas de estimación', () => {
  const p = agencyAds(ctx('usd'))
  for (const s of ['una cifra', 'como hablaría una persona']) assertStringIncludes(p, s)
  for (const s of ['Objetivo estimado', '"de media"']) assert(!p.includes(s), `no debe empujar a escribir "${s}"`)
})

Deno.test('agencyAds usa el dolor del cliente ideal y la oferta del alumno', () => {
  const p = agencyAds(ctx('usd'))
  assertStringIncludes(p, 'CLIENTE IDEAL YA DEFINIDO')
  assertStringIncludes(p, 'OFERTA YA DEFINIDA')
  for (const s of ['dolores', 'urgencia']) assertStringIncludes(p, s)
  assertStringIncludes(p, 'Nunca inventes')
})

Deno.test('agencyAds en euros no habla de dólares ni de hispanos en EE. UU.', () => {
  const p = agencyAds(ctx('eur'))
  assert(!p.includes('$'), 'no debe aparecer el símbolo $')
  assert(!p.includes('hispanos en EE. UU.'), 'no debe hablar de hispanos en EE. UU.')
  assertStringIncludes(p, 'España')
})
