import { assert, assertStringIncludes } from 'jsr:@std/assert@1'
import { agencySite, agencySitePremium, type Ctx } from './prompts.ts'

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
