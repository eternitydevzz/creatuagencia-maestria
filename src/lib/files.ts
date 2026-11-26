/** Descarga un texto como archivo. */
export function saveFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  // El <a> tiene que estar en el documento (Firefox ignora `download` si no lo está) y el blob no se puede revocar
  // hasta que el navegador haya empezado a leerlo: revocarlo justo tras el clic cancelaba la descarga.
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

const attr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Página que muestra un HTML dentro de un iframe aislado. Un blob: tiene el mismo origen que la app; si la landing (que lleva
 *  JavaScript) se abriera tal cual, un fallo de escape le daría acceso a la sesión del alumno. Con sandbox y sin
 *  allow-same-origin, sus scripts corren en un origen propio, igual que en la vista previa de la app. */
export function sandboxedPage(html: string): string {
  const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? 'Landing'
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>`
    + '<style>html,body{margin:0;height:100%;background:#03050c}iframe{display:block;width:100%;height:100%;border:0}</style></head><body>'
    + `<iframe sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms" srcdoc="${attr(html)}"></iframe></body></html>`
}

/** Abre un HTML en una pestaña nueva (sin document.write: se sirve como archivo temporal), dentro de un iframe aislado. */
export function openHtml(html: string) {
  const url = URL.createObjectURL(new Blob([sandboxedPage(html)], { type: 'text/html;charset=utf-8' }))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const slug = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase().replace(/^-+|-+$/g, '') || 'agencia'
