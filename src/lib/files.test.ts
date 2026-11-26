import { describe, expect, it } from 'vitest'
import { sandboxedPage } from './files'

describe('sandboxedPage', () => {
  it('mete la landing en un iframe aislado: scripts sí, mismo origen que la app no', () => {
    const page = sandboxedPage('<p>Hola</p>')
    const sandbox = page.match(/sandbox="([^"]*)"/)?.[1] ?? ''
    expect(sandbox).toContain('allow-scripts')
    expect(sandbox).toContain('allow-popups')
    expect(sandbox).not.toContain('allow-same-origin')
    expect(page).not.toMatch(/<script/i) // la página exterior (que sí tiene el origen de la app) no ejecuta nada
  })

  it('escapa la landing dentro de srcdoc para que no pueda cerrar el atributo', () => {
    const page = sandboxedPage('<a href="x">"&</a><script>alert(1)</script>')
    const srcdoc = page.match(/srcdoc="([^"]*)"/)?.[1] ?? ''
    expect(srcdoc).toContain('&lt;a href=&quot;x&quot;&gt;&quot;&amp;&lt;/a&gt;')
    expect(page).not.toContain('<script>alert(1)')
  })

  it('usa el título de la landing en la pestaña', () => {
    expect(sandboxedPage('<html><head><title>Agencia Norte · Fisio</title></head></html>')).toContain('<title>Agencia Norte · Fisio</title>')
  })
})
