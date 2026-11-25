import { describe, expect, it } from 'vitest'
import { siteHtml } from './siteHtml'
import { renderAgencySite } from './agencySite'
import { renderPremiumSite } from './premiumSite/render'
import { SITE } from './premiumSite/fixture.test-data'
import type { AgencySite } from './types'

const CONTACT = { whatsapp: '34600000000' }
// Landing guardada con el formato de siempre (proyectos que ya existen): sin "plantilla"
const OLD: AgencySite = { direccion: 'editorial', hero: { titulo: 'Más citas sin coger el teléfono', subtitulo: 'Asistente de WhatsApp para clínicas', cta: 'Quiero mi demo' }, faq: [{ pregunta: '¿Cuánto cuesta?', respuesta: 'Desde 300 € al mes.' }] }

describe('siteHtml', () => {
  it('una landing premium se pinta con la plantilla de Jose y con JavaScript', () => {
    const r = siteHtml(SITE, CONTACT, 'Agencia Norte')
    expect(r.scripts).toBe(true)
    expect(r.html).toBe(renderPremiumSite(SITE, CONTACT, 'Agencia Norte'))
  })

  it('una landing guardada con el formato viejo se ve exactamente igual que antes y sin JavaScript', () => {
    const r = siteHtml(OLD, CONTACT, 'Agencia Norte')
    expect(r.scripts).toBe(false)
    expect(r.html).toBe(renderAgencySite(OLD, CONTACT, 'Agencia Norte'))
  })

  it('una página propia (modo directo antiguo) se muestra tal cual, con JavaScript', () => {
    const r = siteHtml({ ...OLD, html: '<!doctype html><p>página propia</p>' }, CONTACT, 'Agencia Norte')
    expect(r.scripts).toBe(true)
    expect(r.html).toBe('<!doctype html><p>página propia</p>')
  })
})
