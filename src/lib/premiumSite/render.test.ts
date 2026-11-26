import { describe, expect, it } from 'vitest'
import { renderPremiumSite } from './render'
import { SITE } from './fixture.test-data'

const WA = { whatsapp: '34 600-000-000' }
const siteData = (html: string) => html.match(/<script type="application\/json" id="site-data">([\s\S]*?)<\/script>/)?.[1] ?? ''

describe('renderPremiumSite', () => {
  it('no deja rastro de Eternity ni de la clínica de Miami', () => {
    const html = renderPremiumSite(SITE, WA, 'Agencia Norte')
    for (const s of ['Eternity', 'ETERNITY', 'Clínica Brisa', 'Miami', 'Herrera', 'Dr. Ruiz']) expect(html).not.toContain(s)
  })

  it('escapa el texto que viene del alumno o de la IA', () => {
    const html = renderPremiumSite(SITE, WA, 'A<b>"&')
    expect(html).toContain('A&lt;b&gt;&quot;&amp;')
    expect(html).not.toContain('<b>"')
  })

  it('el JSON dentro del <script> no se puede cerrar con texto del chat', () => {
    const chat = [...SITE.demo.chat, { de: 'cliente' as const, texto: '</script><script>alert(1)', hora: '22:13' }]
    const html = renderPremiumSite({ ...SITE, demo: { ...SITE.demo, chat } }, WA, 'Agencia Norte')
    expect(siteData(html)).not.toContain('</script><script>')
    expect(html).not.toContain('</script><script>alert(1)')
  })

  it('con WhatsApp, el formulario envía a su número', () => {
    const html = renderPremiumSite(SITE, WA, 'Agencia Norte')
    expect(html).toContain('id="lead-form"')
    expect(siteData(html)).toContain('34600000000')
  })

  it('sin WhatsApp ni email no hay formulario ni enlaces wa.me vacíos', () => {
    const html = renderPremiumSite(SITE, {}, 'Agencia Norte')
    expect(html).not.toContain('id="lead-form"')
    expect(html).not.toContain('wa.me/?')
    expect(html).not.toContain('wa.me/"')
  })

  it('lleva el CSS de la plantilla dentro (si no, el test de acento no vería los estilos)', () => {
    const html = renderPremiumSite(SITE, WA, 'Agencia Norte')
    const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ''
    expect(css.length).toBeGreaterThan(10000)
    expect(css).toContain('.inf-path{')
  })

  it('el acento por defecto (cian) mantiene el color original en el CSS', () => {
    const html = renderPremiumSite({ ...SITE, acento: 'cian' }, WA, 'Agencia Norte')
    expect(html.toUpperCase()).toContain('5CE1FF')
  })

  it('el color de acento cambia el cian original', () => {
    const html = renderPremiumSite({ ...SITE, acento: 'verde' }, WA, 'Agencia Norte')
    expect(html.toUpperCase()).not.toContain('5CE1FF')
    expect(html).not.toContain('92,225,255')
  })

  it('no lleva el símbolo ∞ de Eternity en ningún sitio', () => {
    const html = renderPremiumSite(SITE, WA, 'Agencia Norte')
    expect(html).not.toContain('∞')
    expect(html).not.toContain('M12 12C9.5 8.6') // el dibujo del infinito (logo, carga, separadores, favicon)
    expect(html).not.toContain('1 + st * st') // la curva del infinito de las partículas del hero
  })

  it('pinta todas las secciones y el titular', () => {
    const html = renderPremiumSite(SITE, WA, 'Agencia Norte')
    for (const id of ['top', 'manifiesto', 'demo', 'servicios', 'proceso', 'resultados', 'faq', 'contacto']) expect(html).toContain(`id="${id}"`)
    expect(html).toContain(SITE.hero.titulo)
    expect(html).toContain(SITE.demo.negocio)
  })
})
