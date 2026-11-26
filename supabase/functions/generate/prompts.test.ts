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

Deno.test('agencyContent en euros no habla de dólares ni de EE. UU.', () => {
  const p = agencyContent(ctx('eur'))
  assert(!p.includes('$'), 'no debe aparecer el símbolo $')
  assert(!p.includes('EE. UU.'), 'no debe hablar de EE. UU.')
})

Deno.test('agencyAds sigue los 7 bloques de la estructura de anuncios', () => {
  const p = agencyAds(ctx('usd'))
  for (const s of ['Nicho + identidad', 'Enemigo', 'esto es para ti', 'Estamos ayudando', 'Qué te damos', 'Olvídate de', 'Escasez']) assertStringIncludes(p, s)
  for (const s of ['"anuncios"', '"videos"', '"publico"', '"texto_principal"', '"titular"', '"descripcion"', '"boton"', '"guion"', '"intereses"', '"comportamientos"']) assertStringIncludes(p, s)
})

Deno.test('agencyAds rellena cada bloque con el cliente ideal y la oferta del alumno', () => {
  const p = agencyAds(ctx('usd'))
  assertStringIncludes(p, 'CLIENTE IDEAL YA DEFINIDO')
  assertStringIncludes(p, 'OFERTA YA DEFINIDA')
  for (const s of ['como_capta_hoy', 'dolores', 'incluye', 'urgencia']) assertStringIncludes(p, s)
  assertStringIncludes(p, 'Nunca inventes')
})

Deno.test('agencyAds en euros no habla de dólares ni de hispanos en EE. UU.', () => {
  const p = agencyAds(ctx('eur'))
  assert(!p.includes('$'), 'no debe aparecer el símbolo $')
  assert(!p.includes('hispanos en EE. UU.'), 'no debe hablar de hispanos en EE. UU.')
  assertStringIncludes(p, 'España')
})
