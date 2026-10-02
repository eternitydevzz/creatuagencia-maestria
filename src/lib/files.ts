/** Descarga un texto como archivo. */
export function saveFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** Abre un HTML en una pestaña nueva (sin document.write: se sirve como archivo temporal). */
export function openHtml(html: string) {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export const slug = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase().replace(/^-+|-+$/g, '') || 'agencia'
