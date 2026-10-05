// Plantilla fija de la web de la agencia: la IA solo escribe los textos (agency_site), aquí se monta el HTML premium.
// Cambiar este archivo actualiza el aspecto de TODAS las webs ya generadas (no hace falta volver a gastar créditos).
// Todas las secciones son opcionales: si la IA no devuelve una, no se pinta.
//
// DIRECCIONES VISUALES: hay cinco (ver DIRECTIONS). Cada una cambia paleta, tipografía, fondos, radios, sombras Y
// composición (el hero se centra o se alinea a la izquierda; los problemas y beneficios se pintan como tarjetas, como
// filas numeradas o a dos columnas). La dirección se elige de forma determinista a partir del nombre de la agencia y su
// nicho, así que una misma landing siempre se ve igual; la IA puede forzar una con el campo opcional `direccion`.
//
// SIN JAVASCRIPT, A PROPÓSITO: la vista previa del panel usa un iframe con sandbox sin `allow-scripts`, y el alumno
// publica este archivo tal cual. Todo el movimiento es CSS (`animation-timeline: view()` donde el navegador lo soporte)
// y respeta `prefers-reduced-motion`.
import type { AgencySite, AgencyContact } from './types'

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

const initials = (name: string) => {
  const w = name.trim().split(/\s+/).filter(Boolean)
  return ((w[0]?.[0] ?? 'A') + (w[1]?.[0] ?? '')).toUpperCase()
}

/** Enlace de los CTAs: WhatsApp si hay número, si no email, si no ancla al final. */
function ctaHref(contact: AgencyContact, agency: string): string {
  const wa = (contact.whatsapp ?? '').replace(/\D/g, '')
  if (wa) return `https://wa.me/${wa}?text=${encodeURIComponent(`Hola, vengo de la web de ${agency} y quiero ver una demo.`)}`
  if (contact.email) return `mailto:${contact.email}?subject=${encodeURIComponent('Quiero ver una demo')}`
  return '#contacto'
}

type Point = { titulo?: string; texto?: string; coste?: string; plazo?: string }

const ICON = {
  warn: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2 1 21h22L12 2Zm0 6v6m0 4h.01" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  cross: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg class="btn-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}

// ---------------------------------------------------------------- direcciones visuales
interface Direction {
  id: string
  /** Familias de Google Fonts a cargar y cómo se usan. */
  fonts: { families: string[]; display: string; body: string; mono: string; displayWeight: number; displayTracking: string }
  /** Variables CSS propias de la dirección. */
  tokens: Record<string, string>
  /** Decisiones de composición, no solo de color. */
  layout: {
    hero: 'center' | 'left'
    /** Tarjetas en rejilla · filas numeradas a todo el ancho · dos columnas con el titular fijo a la izquierda. */
    points: 'cards' | 'rows' | 'split'
    /** Líneas verticales que marcan el ancho del contenedor, con cuadraditos en las esquinas. */
    lines: boolean
    /** Fondos alternos entre secciones. */
    alt: boolean
    light: boolean
  }
  /** CSS extra que solo aplica a esta dirección. */
  extra: string
}

const DIRECTIONS: Direction[] = [
  {
    // 1. Tecnológico azul: oscuro, geométrico, con guías técnicas y micro-etiquetas monoespaciadas.
    id: 'tech-blue',
    fonts: { families: ['Inter:wght@400;500;600;700;800', 'JetBrains+Mono:wght@500;700'], display: "'Inter'", body: "'Inter'", mono: "'JetBrains Mono'", displayWeight: 800, displayTracking: '-.028em' },
    tokens: {
      '--bg': '#070a14', '--panel': 'rgba(255,255,255,.035)', '--panel-2': 'rgba(255,255,255,.012)',
      '--line': 'rgba(255,255,255,.09)', '--line-soft': 'rgba(255,255,255,.055)',
      '--text': '#e7ecf7', '--muted': '#9aa7c5', '--muted-2': '#6f7ea3',
      '--accent': '#2f6df6', '--accent-2': '#39d7f0', '--accent-text': '#8fb4ff',
      '--good': '#7ee787', '--bad': '#ff9b9b',
      '--radius': '16px', '--radius-lg': '20px',
      '--shadow': '0 1px 1px -.5px rgba(0,0,0,.5), 0 3px 3px -1.5px rgba(0,0,0,.4), 0 8px 8px -4px rgba(0,0,0,.3)',
      '--shadow-lg': '0 2.8px 2.2px rgba(0,0,0,.14), 0 12.5px 10px rgba(0,0,0,.2), 0 41.8px 33.4px rgba(0,0,0,.26), 0 100px 80px rgba(0,0,0,.34)',
      '--body-bg': 'radial-gradient(ellipse 62% 40% at 50% -8%, rgba(47,109,246,.26), transparent 68%), linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px)',
      '--body-bg-size': 'auto, 46px 46px, 46px 46px',
      '--section-pad': '92px',
    },
    layout: { hero: 'center', points: 'cards', lines: true, alt: false, light: false },
    extra: `
  .kicker { font-family:var(--mono); font-size:.7rem; letter-spacing:.2em }
  .pcard { background:linear-gradient(180deg,var(--panel),var(--panel-2)) }
  section { border-bottom:1px solid var(--line-soft) }
  .stat b { font-variant-numeric:tabular-nums }`,
  },
  {
    // 2. Oscuro con acentos violeta: casi negro, tipografía display ancha, cristal y resplandores. Filas en vez de tarjetas.
    id: 'violet-dark',
    fonts: { families: ['Space+Grotesk:wght@500;600;700', 'Inter:wght@400;500;600;700'], display: "'Space Grotesk'", body: "'Inter'", mono: "'Inter'", displayWeight: 700, displayTracking: '-.032em' },
    tokens: {
      '--bg': '#08060f', '--panel': 'rgba(255,255,255,.045)', '--panel-2': 'rgba(255,255,255,.015)',
      '--line': 'rgba(255,255,255,.1)', '--line-soft': 'rgba(255,255,255,.05)',
      '--text': '#ece8f7', '--muted': '#a79fc2', '--muted-2': '#7a7196',
      '--accent': '#7c5cff', '--accent-2': '#e45cff', '--accent-text': '#c3aeff',
      '--good': '#7ee7b8', '--bad': '#ff9bb5',
      '--radius': '22px', '--radius-lg': '28px',
      '--shadow': '0 2px 8px rgba(0,0,0,.45), 0 12px 32px -12px rgba(124,92,255,.3)',
      '--shadow-lg': '0 8px 24px rgba(0,0,0,.5), 0 48px 80px -32px rgba(124,92,255,.42)',
      '--body-bg': 'radial-gradient(ellipse 70% 44% at 18% -6%, rgba(124,92,255,.34), transparent 64%), radial-gradient(ellipse 54% 36% at 92% 14%, rgba(228,92,255,.2), transparent 68%), radial-gradient(ellipse 60% 40% at 50% 104%, rgba(124,92,255,.16), transparent 70%)',
      '--body-bg-size': 'auto, auto, auto',
      '--section-pad': '104px',
    },
    layout: { hero: 'center', points: 'rows', lines: false, alt: false, light: false },
    extra: `
  h1 { font-size:clamp(2.4rem,6.2vw,4.4rem) }
  .lead { font-size:1.22rem }
  .prow { backdrop-filter:blur(12px) }
  .offer { backdrop-filter:blur(16px) }
  .hero-eyebrow { backdrop-filter:blur(10px) }`,
  },
  {
    // 3. Claro con degradados suaves: luminoso, aireado, dos columnas. Mucho aire y sombras neutras largas.
    id: 'soft-light',
    fonts: { families: ['Plus+Jakarta+Sans:wght@400;500;600;700;800'], display: "'Plus Jakarta Sans'", body: "'Plus Jakarta Sans'", mono: "'Plus Jakarta Sans'", displayWeight: 800, displayTracking: '-.03em' },
    tokens: {
      '--bg': '#f7f8fc', '--panel': '#ffffff', '--panel-2': '#ffffff',
      '--line': 'rgba(18,27,56,.1)', '--line-soft': 'rgba(18,27,56,.06)',
      '--text': '#1d2746', '--muted': '#5a6688', '--muted-2': '#7c87a8',
      '--accent': '#3b5bfd', '--accent-2': '#7a5cf0', '--accent-text': '#2c47d6',
      '--good': '#15926a', '--bad': '#d9435e',
      '--radius': '18px', '--radius-lg': '26px',
      '--shadow': '0 0 0 1px rgba(18,27,56,.05), 0 1px 1px -.5px rgba(18,27,56,.05), 0 3px 3px -1.5px rgba(18,27,56,.05), 0 6px 6px -3px rgba(18,27,56,.05), 0 12px 12px -6px rgba(18,27,56,.05)',
      '--shadow-lg': '0 2.8px 2.2px rgba(18,27,56,.025), 0 6.7px 5.3px rgba(18,27,56,.035), 0 12.5px 10px rgba(18,27,56,.045), 0 22.3px 17.9px rgba(18,27,56,.055), 0 41.8px 33.4px rgba(18,27,56,.065), 0 100px 80px rgba(18,27,56,.09)',
      '--body-bg': 'radial-gradient(ellipse 70% 42% at 50% -10%, rgba(59,91,253,.14), transparent 66%), radial-gradient(ellipse 50% 34% at 96% 8%, rgba(122,92,240,.1), transparent 70%)',
      '--body-bg-size': 'auto, auto',
      '--section-pad': '104px',
    },
    layout: { hero: 'center', points: 'split', lines: false, alt: true, light: true },
    extra: `
  h1,h2,h3 { color:#111a38 }
  .pcard, .fit-col, .stat, details, .table-wrap { background:#fff }
  .section-alt { background:linear-gradient(180deg, rgba(59,91,253,.045), rgba(59,91,253,.012)) }
  .offer { background:#fff }
  .hero-eyebrow { background:#fff; box-shadow:var(--shadow) }`,
  },
  {
    // 4. Editorial minimalista: papel crema, display con serifa, reglas finas en vez de tarjetas, hero a la izquierda.
    id: 'editorial',
    fonts: { families: ['Instrument+Serif:ital@0;1', 'Inter:wght@400;500;600;700'], display: "'Instrument Serif'", body: "'Inter'", mono: "'Inter'", displayWeight: 400, displayTracking: '-.012em' },
    tokens: {
      '--bg': '#faf7f2', '--panel': '#fffdfa', '--panel-2': '#fffdfa',
      '--line': 'rgba(32,26,20,.14)', '--line-soft': 'rgba(32,26,20,.08)',
      '--text': '#2a231b', '--muted': '#6b6054', '--muted-2': '#8d8375',
      '--accent': '#b2451f', '--accent-2': '#d98b3a', '--accent-text': '#9c3c1a',
      '--good': '#3f7a4e', '--bad': '#aa3b2f',
      '--radius': '4px', '--radius-lg': '6px',
      '--shadow': 'none',
      '--shadow-lg': '0 1px 2px rgba(32,26,20,.06), 0 12px 28px -16px rgba(32,26,20,.18)',
      '--body-bg': 'none',
      '--body-bg-size': 'auto',
      '--section-pad': '88px',
    },
    layout: { hero: 'left', points: 'rows', lines: true, alt: false, light: true },
    extra: `
  h1 { font-size:clamp(2.7rem,6.6vw,4.6rem); line-height:1.04 }
  h2 { font-size:clamp(1.8rem,3.6vw,2.7rem) }
  h1,h2 { font-weight:400 }
  h3 { font-family:var(--body); font-weight:700; letter-spacing:0 }
  .kicker { font-size:.7rem; letter-spacing:.22em; color:var(--accent-text) }
  .lead { font-size:1.2rem; max-width:54ch }
  section { border-bottom:1px solid var(--line-soft) }
  .pcard, .fit-col, .stat, details { background:transparent; box-shadow:none }
  .stat { border:none; border-top:2px solid var(--text); border-radius:0; padding:18px 0 0 }
  .stat b { background:none; -webkit-text-fill-color:currentColor; color:var(--text); font-family:var(--display); font-weight:400; font-size:2.9rem }
  .btn { border-radius:2px }
  .offer-wrap { background:var(--text) }
  .proofs li svg { color:var(--accent) }`,
  },
  {
    // 5. Corporativo elegante: pizarra profunda con acento ámbar, radios cortos, hero a dos columnas, tablas protagonistas.
    id: 'corporate',
    fonts: { families: ['Libre+Franklin:wght@400;500;600;700;800'], display: "'Libre Franklin'", body: "'Libre Franklin'", mono: "'Libre Franklin'", displayWeight: 700, displayTracking: '-.022em' },
    tokens: {
      '--bg': '#0d1117', '--panel': 'rgba(255,255,255,.04)', '--panel-2': 'rgba(255,255,255,.015)',
      '--line': 'rgba(222,205,170,.16)', '--line-soft': 'rgba(222,205,170,.09)',
      '--text': '#e8e4da', '--muted': '#a39d90', '--muted-2': '#7d776c',
      '--accent': '#c79a3f', '--accent-2': '#e3c478', '--accent-text': '#e0c179',
      '--good': '#6fae7d', '--bad': '#c9736a',
      '--radius': '8px', '--radius-lg': '10px',
      '--shadow': '0 1px 2px rgba(0,0,0,.4), 0 8px 20px -10px rgba(0,0,0,.5)',
      '--shadow-lg': '0 4px 10px rgba(0,0,0,.4), 0 32px 60px -28px rgba(0,0,0,.6)',
      '--body-bg': 'linear-gradient(180deg, rgba(199,154,63,.08), transparent 42%)',
      '--body-bg-size': 'auto',
      '--section-pad': '88px',
    },
    layout: { hero: 'left', points: 'split', lines: false, alt: true, light: false },
    extra: `
  .kicker { letter-spacing:.2em; font-size:.7rem }
  .section-alt { background:rgba(255,255,255,.018) }
  .btn { border-radius:4px; text-transform:none }
  .compare thead th { background:rgba(199,154,63,.07) }
  .stat b { background:none; -webkit-text-fill-color:currentColor; color:var(--accent-text) }
  section { border-bottom:1px solid var(--line-soft) }`,
  },
]

/** Hash estable (FNV-1a de 32 bits): la misma agencia y nicho siempre dan la misma dirección visual. */
function hash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h >>> 0
}

/** La IA puede fijar la dirección con `direccion`; si no, sale del nombre de la agencia y del nicho. */
function directionFor(s: AgencySite, agency: string): Direction {
  // a una const local: dentro del callback, TS no estrecha el tipo de una propiedad mutable
  const want = typeof s.direccion === 'string' ? s.direccion.trim().toLowerCase() : ''
  const forced = want ? DIRECTIONS.find((d) => d.id === want) : undefined
  if (forced) return forced
  const seed = `${agency}|${s.meta?.title ?? ''}|${s.hero?.eyebrow ?? ''}`
  return DIRECTIONS[hash(seed) % DIRECTIONS.length]
}

export function renderAgencySite(s: AgencySite, contact: AgencyContact, agency: string): string {
  const dir = directionFor(s, agency)
  const L = dir.layout
  const href = esc(ctaHref(contact, agency))
  // WhatsApp se abre en pestaña nueva (en la vista previa, además, no puede cargarse dentro del iframe)
  const external = href.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''
  const btn = (text: string | undefined, cls = 'btn') => text ? `<a class="${cls}" href="${href}"${external}>${esc(text)}${ICON.arrow}</a>` : ''
  const list = <T,>(xs: T[] | undefined) => (Array.isArray(xs) ? xs : [])

  // Las secciones se numeran para alternar fondos (solo en las direcciones que lo piden)
  let nth = 0
  const section = (kicker: string, inner: string, center = false, id = '') => {
    nth++
    const alt = L.alt && nth % 2 === 0 ? ' section-alt' : ''
    return `<section class="sec${alt}"${id ? ` id="${id}"` : ''}><div class="wrap${center ? ' center' : ''}">${kicker ? `<span class="kicker">${kicker}</span>` : ''}${inner}</div></section>`
  }

  // ---- tres composiciones distintas para los mismos datos (problemas y beneficios)
  const asCards = (items: Point[], variant: 'problem' | 'solution') =>
    `<div class="grid">${items.map((p) => `<div class="pcard ${variant} reveal"><div class="pcard-top"><span class="pcard-mark" aria-hidden="true">${variant === 'problem' ? ICON.warn : ICON.check}</span>${p.coste ? `<span class="cost">${esc(p.coste)}</span>` : ''}</div><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div>`).join('')}</div>`

  const asRows = (items: Point[], variant: 'problem' | 'solution') =>
    `<div class="prows">${items.map((p, i) => `<div class="prow ${variant} reveal"><span class="prow-idx" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div class="prow-body"><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div>${p.coste ? `<span class="cost">${esc(p.coste)}</span>` : ''}</div>`).join('')}</div>`

  const asSplit = (items: Point[], variant: 'problem' | 'solution', heading: string, intro?: string) =>
    `<div class="split"><div class="split-head"><h2>${heading}</h2>${intro ? `<p class="section-intro">${intro}</p>` : ''}</div><div class="split-body">${items.map((p) => `<div class="sitem ${variant} reveal"><span class="sitem-mark" aria-hidden="true">${variant === 'problem' ? ICON.warn : ICON.check}</span><div><h3>${esc(p.titulo)}${p.coste ? ` <span class="cost inline">${esc(p.coste)}</span>` : ''}</h3><p>${esc(p.texto)}</p></div></div>`).join('')}</div></div>`

  /** Monta la sección de problemas o de beneficios con la composición de esta dirección. */
  const points = (kicker: string, titulo: string | undefined, intro: string | undefined, items: Point[] | undefined, variant: 'problem' | 'solution') => {
    const xs = list(items)
    if (!xs.length && !titulo) return ''
    const h = esc(titulo); const i = intro ? esc(intro) : ''
    if (L.points === 'split') return section(kicker, asSplit(xs, variant, h, i))
    const body = L.points === 'rows' ? asRows(xs, variant) : asCards(xs, variant)
    return section(kicker, `<h2>${h}</h2>${i ? `<p class="section-intro">${i}</p>` : ''}${body}`)
  }

  const stepCards = (items: Point[] | undefined) =>
    `<div class="grid steps">${list(items).map((p, i) => `<div class="pcard step reveal"><div class="pcard-top"><span class="pcard-num">${i + 1}</span>${p.plazo ? `<span class="plazo">${esc(p.plazo)}</span>` : ''}</div><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div>`).join('')}</div>`

  const checklist = (items: string[] | undefined, cls = 'check-list') => `<ul class="${cls}">${list(items).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`

  const comparativa = () => {
    const c = s.comparativa
    const cols = list(c?.columnas)
    const rows = list(c?.filas)
    if (!c || !cols.length || !rows.length) return ''
    const last = cols.length - 1
    return section('La comparativa', `<h2>${esc(c.titulo)}</h2><div class="table-wrap reveal"><table class="compare"><thead><tr><th></th>${cols.map((h, i) => `<th${i === last ? ' class="hl"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.aspecto)}</th>${cols.map((_, i) => `<td${i === last ? ' class="hl"' : ''}>${esc(list(r.valores)[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
  }

  const paraQuien = () => {
    const p = s.para_quien
    if (!p || (!list(p.si).length && !list(p.no).length)) return ''
    return section('Para quién es', `<h2>${esc(p.titulo)}</h2><div class="fit"><div class="fit-col yes reveal"><h3>Es para ti si…</h3>${checklist(p.si, 'fit-list yes')}</div><div class="fit-col no reveal"><h3>No es para ti si…</h3>${checklist(p.no, 'fit-list no')}</div></div>`)
  }

  const oferta = () => {
    const o = s.oferta
    if (!o) return ''
    nth++
    // La etiqueta es una frase corta; si la IA escribió un párrafo, va como texto bajo el precio en vez de romper la etiqueta
    const short = (o.escasez ?? '').trim().length <= 60
    const badge = short && o.escasez ? o.escasez : 'Plazas limitadas cada mes'
    const urgency = [short ? '' : o.escasez, o.urgencia].filter(Boolean).join(' ')
    return `<section class="sec${L.alt && nth % 2 === 0 ? ' section-alt' : ''}" id="oferta"><div class="wrap center"><span class="kicker">La oferta</span><h2>${esc(o.titulo)}</h2><div class="offer-wrap reveal"><div class="offer">
  <span class="offer-badge">${esc(badge)}</span>
  <h3>${esc(o.nombre)}</h3>
  ${checklist(o.incluye)}
  ${list(o.bonos).length ? `<div class="bonus"><span class="bonus-t">Incluido sin coste</span>${checklist(o.bonos, 'bonus-list')}</div>` : ''}
  <div class="price-row">${o.precio_anclaje ? `<span class="anchor">Valor ${esc(o.precio_anclaje)}</span>` : ''}<span class="price">${esc(o.precio)}</span></div>
  ${urgency ? `<p class="urgency">${esc(urgency)}</p>` : ''}
  ${o.garantia ? `<p class="guarantee">${ICON.check}${esc(o.garantia)}</p>` : ''}
  ${btn(o.cta || s.hero?.cta)}
</div></div></div></section>`
  }

  const garantia = () => s.garantia?.texto
    ? section('', `<div class="guarantee-box reveal"><span class="g-icon">${ICON.shield}</span><div><h2>${esc(s.garantia.titulo || 'Nuestra garantía')}</h2><p>${esc(s.garantia.texto)}</p></div></div>`)
    : ''

  const fundador = () => s.nota_fundador?.texto
    ? section('Quiénes somos', `<div class="founder reveal"><h2>${esc(s.nota_fundador.titulo)}</h2><p>${esc(s.nota_fundador.texto)}</p><span class="signature">${esc(s.nota_fundador.firma || `El equipo de ${agency}`)}</span></div>`)
    : ''

  const contactLine = [contact.whatsapp && `WhatsApp: ${esc(contact.whatsapp)}`, contact.email && `Email: <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`].filter(Boolean).join(' · ')
  const mono = esc(initials(agency))
  const tokens = Object.entries(dir.tokens).map(([k, v]) => `${k}:${v}`).join('; ')
  const fontsHref = `https://fonts.googleapis.com/css2?${dir.fonts.families.map((f) => `family=${f}`).join('&')}&display=swap`
  const proofs = list(s.hero?.pruebas)

  // El hero cambia de composición: centrado, o a dos columnas con las garantías en una tarjeta al lado
  const heroInner = L.hero === 'left'
    ? `<div class="hero-split">
    <div>
      ${s.hero?.eyebrow ? `<span class="hero-eyebrow"><span class="dot"></span>${esc(s.hero.eyebrow)}</span>` : ''}
      <h1>${esc(s.hero?.titulo)}</h1>
      <p class="lead">${esc(s.hero?.subtitulo)}</p>
      <div class="hero-actions">${btn(s.hero?.cta)}</div>
      ${s.hero?.nota ? `<p class="note">${esc(s.hero.nota)}</p>` : ''}
    </div>
    ${proofs.length ? `<aside class="hero-aside"><span class="kicker">Lo que incluye trabajar con nosotros</span><ul class="proofs stacked">${proofs.map((x) => `<li>${ICON.check}${esc(x)}</li>`).join('')}</ul></aside>` : ''}
  </div>`
    : `${s.hero?.eyebrow ? `<span class="hero-eyebrow"><span class="dot"></span>${esc(s.hero.eyebrow)}</span>` : ''}
  <h1>${esc(s.hero?.titulo)}</h1>
  <p class="lead">${esc(s.hero?.subtitulo)}</p>
  <div class="hero-actions">${btn(s.hero?.cta)}</div>
  ${s.hero?.nota ? `<p class="note">${esc(s.hero.nota)}</p>` : ''}
  ${proofs.length ? `<ul class="proofs">${proofs.map((x) => `<li>${ICON.check}${esc(x)}</li>`).join('')}</ul>` : ''}`

  return `<!doctype html>
<html lang="es" data-direction="${dir.id}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.meta?.title || agency)}</title>
<meta name="description" content="${esc(s.meta?.description)}">
<meta name="color-scheme" content="${L.light ? 'light' : 'dark'}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontsHref}">
<style>
  /* ---- tokens de la dirección visual: ${dir.id} */
  :root {
    ${tokens};
    --display: ${dir.fonts.display}, Georgia, serif;
    --body: ${dir.fonts.body}, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --mono: ${dir.fonts.mono}, ui-monospace, SFMono-Regular, Menlo, monospace;
    --display-weight: ${dir.fonts.displayWeight};
    --display-tracking: ${dir.fonts.displayTracking};
    --grad: linear-gradient(135deg, var(--accent), var(--accent-2));
    --container-max: 1120px;
    --container-pad: clamp(18px, 4vw, 44px);
  }

  /* ---- escala tipográfica (base 16px, razón 1.25) con alturas de línea por papel */
  * { box-sizing:border-box }
  html { scroll-behavior:smooth; -webkit-text-size-adjust:100% }
  body {
    margin:0; background:var(--bg); color:var(--text); font-family:var(--body);
    font-size:1rem; line-height:1.6; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
    background-image:var(--body-bg); background-size:var(--body-bg-size); background-attachment:fixed; background-repeat:no-repeat;
  }
  a { color:inherit } ::selection { background:var(--accent); color:#fff }
  img,svg { max-width:100% }
  h1,h2,h3,h4 { font-family:var(--display); font-weight:var(--display-weight); letter-spacing:var(--display-tracking); margin:0 0 .5em; color:var(--text) }
  h1 { font-size:clamp(2.1rem,5.4vw,3.75rem); line-height:1.08; text-wrap:balance }
  h2 { font-size:clamp(1.65rem,3.4vw,2.45rem); line-height:1.18; text-wrap:balance }
  h3 { font-size:1.1rem; line-height:1.34; font-weight:700; letter-spacing:-.01em }
  p { margin:0 0 1em; color:var(--muted); max-width:68ch }
  .wrap { width:min(100% - (var(--container-pad) * 2), var(--container-max)); margin-inline:auto }
  .center { text-align:center } .center p, .center .lead { margin-inline:auto }
  .kicker { display:block; font-family:var(--mono); font-size:.72rem; font-weight:700; letter-spacing:.17em; text-transform:uppercase; color:var(--accent-text); margin-bottom:14px }
  .section-intro { max-width:60ch; font-size:1.04rem }

  /* ---- guías verticales del contenedor con cuadraditos en las esquinas (solo en algunas direcciones) */
  .guides { position:fixed; inset:0; z-index:0; pointer-events:none; display:${L.lines ? 'block' : 'none'} }
  .guides span { position:absolute; top:0; bottom:0; width:1px; background:var(--line-soft) }
  .guides span:first-child { left:max(var(--container-pad), calc((100vw - var(--container-max)) / 2)) }
  .guides span:last-child { right:max(var(--container-pad), calc((100vw - var(--container-max)) / 2)) }
  header, main, footer { position:relative; z-index:1 }

  /* ---- cabecera y botones */
  header { position:sticky; top:0; z-index:20; backdrop-filter:blur(14px); background:color-mix(in srgb, var(--bg) 82%, transparent); border-bottom:1px solid var(--line-soft) }
  header .wrap { display:flex; align-items:center; justify-content:space-between; height:66px; gap:12px }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; font-weight:700; font-size:1rem; letter-spacing:-.01em }
  .mono { display:grid; place-items:center; width:30px; height:30px; flex:none; border-radius:calc(var(--radius) / 2); background:var(--grad); color:#fff; font-weight:800; font-size:.76rem; font-family:var(--body) }

  .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:46px; padding:13px 22px; border-radius:calc(var(--radius) - 4px);
    background:var(--grad); color:#fff; text-decoration:none; font-family:var(--body); font-weight:700; font-size:.95rem; letter-spacing:-.005em;
    box-shadow:var(--shadow); transition:transform .16s ease, box-shadow .16s ease, filter .16s ease }
  .btn:hover { transform:translateY(-1px); filter:brightness(1.07); box-shadow:var(--shadow-lg) }
  .btn:active { transform:translateY(0) scale(.99) }
  .btn:focus-visible { outline:2px solid var(--accent-text); outline-offset:3px }
  .btn-arrow { transition:transform .16s ease } .btn:hover .btn-arrow { transform:translateX(3px) }
  .btn.sm { min-height:38px; padding:9px 16px; font-size:.86rem; box-shadow:none }

  /* ---- ritmo de secciones */
  .sec { padding:var(--section-pad) 0 }
  .hero { padding:clamp(56px,9vw,104px) 0 var(--section-pad) }
  .hero.center-hero { text-align:center }
  .hero h1 { max-width:19ch }
  .hero.center-hero h1 { max-width:24ch; margin-inline:auto }
  .hero-split { display:grid; gap:clamp(28px,5vw,64px); grid-template-columns:1fr; align-items:start }
  @media (min-width:900px) { .hero-split { grid-template-columns:1.35fr .9fr } }
  .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:.76rem; font-weight:600; letter-spacing:.07em; text-transform:uppercase;
    color:var(--accent-text); background:color-mix(in srgb, var(--accent) 12%, transparent); border:1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    padding:7px 14px; border-radius:999px; margin-bottom:20px }
  .hero-eyebrow .dot { width:6px; height:6px; border-radius:99px; background:var(--grad); flex:none }
  .lead { font-size:1.16rem; line-height:1.55; color:var(--muted); max-width:56ch; margin-bottom:28px }
  .hero-actions { display:flex; flex-wrap:wrap; gap:12px; align-items:center }
  .note { font-size:.86rem; color:var(--muted-2); margin-top:16px; max-width:46ch }
  .proofs { display:flex; flex-wrap:wrap; gap:10px 22px; margin:28px 0 0; padding:0; list-style:none }
  .center .proofs { justify-content:center }
  .proofs li { display:inline-flex; align-items:center; gap:8px; font-size:.88rem; color:var(--muted) } .proofs li svg { color:var(--good); flex:none }
  .proofs.stacked { flex-direction:column; gap:14px; margin-top:16px }
  .hero-aside { border:1px solid var(--line); border-radius:var(--radius); padding:26px; background:linear-gradient(180deg,var(--panel),var(--panel-2)); box-shadow:var(--shadow) }
  .hero-aside .kicker { margin-bottom:6px }

  /* ---- composición A: tarjetas en rejilla */
  .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(min(100%,268px),1fr)); margin-top:30px }
  .grid.steps { grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr)) }
  .pcard { border:1px solid var(--line); border-radius:var(--radius); padding:26px; text-align:left; background:var(--panel); box-shadow:var(--shadow);
    transition:transform .2s ease, border-color .2s ease }
  .pcard:hover { transform:translateY(-3px); border-color:color-mix(in srgb, var(--accent) 42%, transparent) }
  .pcard p { margin:0; font-size:.93rem }
  .pcard-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px }
  .pcard-mark { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:calc(var(--radius) / 1.6); flex:none }
  .pcard.problem .pcard-mark { background:color-mix(in srgb, var(--bad) 16%, transparent); color:var(--bad); border:1px solid color-mix(in srgb, var(--bad) 28%, transparent) }
  .pcard.solution .pcard-mark { background:color-mix(in srgb, var(--accent) 16%, transparent); color:var(--accent-text); border:1px solid color-mix(in srgb, var(--accent) 32%, transparent) }
  .pcard-num { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:calc(var(--radius) / 1.6); background:var(--grad); color:#fff; font-weight:800; font-size:.92rem; flex:none; font-family:var(--body) }
  .cost { font-family:var(--mono); font-size:.78rem; font-weight:700; color:var(--bad); background:color-mix(in srgb, var(--bad) 10%, transparent);
    border:1px solid color-mix(in srgb, var(--bad) 22%, transparent); padding:4px 10px; border-radius:999px; white-space:nowrap }
  .cost.inline { margin-left:6px; vertical-align:middle }
  .plazo { font-family:var(--mono); font-size:.72rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--accent-text);
    background:color-mix(in srgb, var(--accent) 12%, transparent); border:1px solid color-mix(in srgb, var(--accent) 26%, transparent); padding:4px 10px; border-radius:999px }

  /* ---- composición B: filas numeradas a todo el ancho */
  .prows { margin-top:34px; display:grid; gap:0 }
  .prow { display:grid; grid-template-columns:auto 1fr; gap:18px 22px; align-items:start; padding:28px 0; border-top:1px solid var(--line-soft) }
  .prow:last-child { border-bottom:1px solid var(--line-soft) }
  .prow-idx { font-family:var(--mono); font-size:.86rem; font-weight:700; color:var(--accent-text); padding-top:4px; letter-spacing:.06em }
  .prow-body h3 { margin-bottom:.35em } .prow-body p { margin:0; font-size:.96rem }
  .prow .cost { grid-column:2; justify-self:start }
  @media (min-width:860px) { .prow { grid-template-columns:auto 1fr auto; align-items:center } .prow .cost { grid-column:auto } }

  /* ---- composición C: dos columnas con el titular fijo a la izquierda */
  .split { display:grid; gap:clamp(26px,4vw,56px); grid-template-columns:1fr; align-items:start }
  @media (min-width:900px) { .split { grid-template-columns:.85fr 1.15fr } .split-head { position:sticky; top:96px } }
  .split-head h2 { margin-bottom:.4em } .split-head p { margin:0 }
  .split-body { display:grid; gap:4px }
  .sitem { display:flex; gap:16px; align-items:flex-start; padding:22px 0; border-top:1px solid var(--line-soft) }
  .sitem:first-child { border-top:none; padding-top:0 }
  .sitem h3 { margin-bottom:.3em } .sitem p { margin:0; font-size:.95rem }
  .sitem-mark { display:inline-grid; place-items:center; width:30px; height:30px; border-radius:999px; flex:none; margin-top:2px }
  .sitem.problem .sitem-mark { background:color-mix(in srgb, var(--bad) 14%, transparent); color:var(--bad) }
  .sitem.solution .sitem-mark { background:color-mix(in srgb, var(--accent) 16%, transparent); color:var(--accent-text) }

  /* ---- tabla comparativa */
  .table-wrap { overflow-x:auto; margin-top:30px; border:1px solid var(--line); border-radius:var(--radius); background:var(--panel); box-shadow:var(--shadow) }
  .compare { width:100%; border-collapse:collapse; min-width:600px; font-size:.92rem }
  .compare th, .compare td { padding:15px 18px; text-align:left; border-bottom:1px solid var(--line-soft); vertical-align:top }
  .compare thead th { font-family:var(--mono); font-size:.74rem; letter-spacing:.08em; text-transform:uppercase; color:var(--muted-2); font-weight:700 }
  .compare tbody th { color:var(--text); font-weight:700; width:24% } .compare td { color:var(--muted) }
  .compare tr:last-child th, .compare tr:last-child td { border-bottom:none }
  .compare .hl { background:color-mix(in srgb, var(--accent) 9%, transparent); color:var(--text) }
  .compare thead .hl { color:var(--accent-text) }

  /* ---- para quién es */
  .fit { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); margin-top:30px }
  .fit-col { border:1px solid var(--line); border-radius:var(--radius); padding:28px; background:var(--panel); box-shadow:var(--shadow) }
  .fit-col.yes { border-color:color-mix(in srgb, var(--good) 28%, transparent) }
  .fit-col.no { border-color:color-mix(in srgb, var(--bad) 24%, transparent) }
  .fit-list { list-style:none; padding:0; margin:0; display:grid; gap:13px }
  .fit-list li { position:relative; padding-left:30px; color:var(--text); font-size:.94rem }
  .fit-list li::before { position:absolute; left:0; top:1px; width:20px; height:20px; border-radius:999px; display:grid; place-items:center; font-size:11px; font-weight:800 }
  .fit-list.yes li::before { content:"✓"; background:color-mix(in srgb, var(--good) 18%, transparent); color:var(--good) }
  .fit-list.no li::before { content:"✕"; background:color-mix(in srgb, var(--bad) 16%, transparent); color:var(--bad) }

  /* ---- la oferta: el único sitio con borde degradado (un solo nivel de jerarquía) */
  .offer-wrap { max-width:760px; margin:32px auto 0; padding:1px; border-radius:var(--radius-lg); text-align:left;
    background:linear-gradient(160deg, color-mix(in srgb, var(--accent-2) 60%, transparent), color-mix(in srgb, var(--accent) 22%, transparent) 42%, var(--line)) }
  .offer { position:relative; border-radius:calc(var(--radius-lg) - 1px); padding:clamp(26px,4vw,42px); background:var(--bg); overflow:hidden; box-shadow:var(--shadow-lg) }
  .offer::before { content:""; position:absolute; top:-40%; right:-20%; width:60%; height:80%; pointer-events:none;
    background:radial-gradient(circle, color-mix(in srgb, var(--accent-2) 20%, transparent), transparent 70%) }
  .offer > * { position:relative }
  .offer-badge { display:inline-block; font-family:var(--mono); font-size:.72rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
    color:var(--accent-text); background:color-mix(in srgb, var(--accent) 12%, transparent); border:1px solid color-mix(in srgb, var(--accent) 30%, transparent);
    padding:5px 12px; border-radius:999px; margin-bottom:18px }
  .offer h3 { font-family:var(--display); font-weight:var(--display-weight); font-size:clamp(1.35rem,2.6vw,1.75rem); margin-bottom:22px; letter-spacing:var(--display-tracking) }
  .check-list { list-style:none; padding:0; margin:0 0 26px; display:grid; gap:13px }
  .check-list li { position:relative; padding-left:34px; color:var(--text); font-size:.96rem }
  .check-list li::before { content:"✓"; position:absolute; left:0; top:0; width:22px; height:22px; border-radius:999px; background:var(--grad); color:#fff; font-size:11px; font-weight:800; display:grid; place-items:center }
  .bonus { border:1px dashed color-mix(in srgb, var(--accent-2) 40%, transparent); border-radius:var(--radius); padding:16px 18px; margin:0 0 26px; background:color-mix(in srgb, var(--accent-2) 5%, transparent) }
  .bonus-t { display:block; font-family:var(--mono); font-size:.72rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--accent-text); margin-bottom:10px }
  .bonus-list { list-style:none; padding:0; margin:0; display:grid; gap:8px }
  .bonus-list li { color:var(--text); font-size:.92rem } .bonus-list li::before { content:"+ "; color:var(--accent-text); font-weight:800 }
  .price-row { display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; margin:0 0 8px }
  .anchor { color:var(--muted-2); text-decoration:line-through; font-size:1.05rem }
  .price { font-family:var(--display); font-size:clamp(1.9rem,4vw,2.4rem); font-weight:var(--display-weight); color:var(--text); letter-spacing:var(--display-tracking) }
  .urgency { color:var(--accent-text); font-size:.9rem; margin:6px 0 4px }
  .guarantee { display:flex; align-items:flex-start; gap:9px; color:var(--muted); font-size:.88rem; margin:10px 0 26px; max-width:none }
  .guarantee svg { flex:none; color:var(--good); margin-top:4px }

  .guarantee-box { display:flex; gap:22px; align-items:flex-start; max-width:820px; margin:0 auto; padding:clamp(24px,3.5vw,34px);
    border-radius:var(--radius); border:1px solid color-mix(in srgb, var(--good) 26%, transparent); background:color-mix(in srgb, var(--good) 6%, transparent) }
  .guarantee-box h2 { font-size:clamp(1.3rem,2.6vw,1.65rem) } .guarantee-box p { margin:0 }
  .g-icon { flex:none; display:grid; place-items:center; width:48px; height:48px; border-radius:var(--radius); background:color-mix(in srgb, var(--good) 16%, transparent); color:var(--good) }

  /* ---- cifras */
  .stats { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(min(100%,196px),1fr)); margin-top:30px }
  .stat { background:var(--panel); border:1px solid var(--line); border-radius:var(--radius); padding:30px 22px; box-shadow:var(--shadow) }
  .stat b { display:block; font-family:var(--display); font-size:clamp(2rem,4.4vw,2.5rem); font-weight:var(--display-weight); line-height:1.05;
    background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent; letter-spacing:var(--display-tracking) }
  .stat span { color:var(--muted); font-size:.89rem; display:block; margin-top:8px }

  .founder { max-width:68ch; padding-left:26px; border-left:2px solid color-mix(in srgb, var(--accent) 55%, transparent) }
  .founder p { font-size:1.06rem; line-height:1.75; color:var(--text) }
  .signature { display:block; margin-top:8px; font-weight:700; color:var(--accent-text) }

  /* ---- preguntas frecuentes */
  .faq { max-width:800px; margin-top:30px }
  details { border:1px solid var(--line); border-radius:var(--radius); margin-bottom:10px; background:var(--panel); overflow:hidden; text-align:left }
  summary { cursor:pointer; font-weight:700; color:var(--text); list-style:none; padding:17px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:46px }
  summary::-webkit-details-marker { display:none }
  summary:focus-visible { outline:2px solid var(--accent-text); outline-offset:-2px }
  summary .plus { flex:none; display:grid; place-items:center; width:24px; height:24px; border-radius:calc(var(--radius) / 2);
    background:color-mix(in srgb, var(--accent) 12%, transparent); color:var(--accent-text); font-size:1.05rem; transition:transform .2s ease }
  details[open] summary .plus { transform:rotate(45deg) }
  details p { margin:0; padding:0 20px 20px; color:var(--muted) }

  /* ---- cierre */
  .cta-final { text-align:center; position:relative }
  .cta-final::before { content:""; position:absolute; inset:0; pointer-events:none;
    background:radial-gradient(ellipse 50% 60% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%) }
  .cta-final > * { position:relative }
  footer { padding:44px 0 100px }
  .footer-row { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding-top:28px; border-top:1px solid var(--line-soft) }
  .footer-brand { display:flex; align-items:center; gap:10px; color:var(--text); font-weight:700 }
  .footer-meta { color:var(--muted-2); font-size:.84rem; text-align:right }

  /* ---- movimiento: solo CSS, sin JavaScript (la vista previa va en un iframe sin scripts)
     REGLA: la animación de scroll NUNCA toca la opacidad. Con animation-timeline:view() el elemento se queda en el
     fotograma inicial mientras no entra en rango, así que ocultarlo dejaría secciones en blanco en una captura de página
     completa, en un PDF, al imprimir o para un rastreador. Solo desplazamos; si la animación no avanza, no se nota nada.
     El hero sí se desvanece porque su animación es por tiempo y siempre termina: está en el primer viewport. */
  @keyframes heroIn { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
  @media (prefers-reduced-motion: no-preference) {
    .hero h1, .hero .lead, .hero .hero-actions, .hero .note, .hero .proofs, .hero-eyebrow, .hero-aside {
      animation:heroIn .62s cubic-bezier(.16,1,.3,1) both }
    .hero h1 { animation-delay:.04s } .hero .lead { animation-delay:.1s }
    .hero .hero-actions { animation-delay:.16s } .hero .note { animation-delay:.21s }
    .hero .proofs, .hero-aside { animation-delay:.26s }
  }
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      @keyframes rise { from { transform:translateY(16px) } to { transform:none } }
      .reveal { animation:rise .7s cubic-bezier(.16,1,.3,1) both; animation-timeline:view(); animation-range:entry 0% entry 46% }
    }
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior:auto }
    *, ::before, ::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important }
  }

  /* ---- CTA fijo en móvil */
  .mobile-cta { display:none }
  @media (max-width:760px) {
    :root { --section-pad:62px }
    h1 { letter-spacing:-.02em }
    p, .lead, .section-intro { max-width:none }
    .guarantee-box { flex-direction:column; gap:16px }
    .founder { padding-left:18px }
    .footer-meta { text-align:left }
    body { padding-bottom:76px }
    .guides { display:none }
    .mobile-cta { display:flex; position:fixed; left:0; right:0; bottom:0; z-index:30; align-items:center; gap:12px; padding:11px 16px;
      background:color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter:blur(14px); border-top:1px solid var(--line) }
    .mobile-cta .mono { flex:none }
    .mobile-cta .mc-name { flex:1; min-width:0; font-weight:700; font-size:.88rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
    .mobile-cta .btn { flex:none; padding:11px 16px; font-size:.86rem; min-height:42px }
  }
${dir.extra}
</style>
</head>
<body>
<div class="guides" aria-hidden="true"><span></span><span></span></div>

<header><div class="wrap">
  <a class="brand" href="#"><span class="mono">${mono}</span>${esc(agency)}</a>
  ${btn(s.nav_cta || s.hero?.cta, 'btn sm')}
</div></header>

<main>
<section class="hero${L.hero === 'center' ? ' center-hero' : ''}"><div class="wrap${L.hero === 'center' ? ' center' : ''}">
  ${heroInner}
</div></section>

${points('El problema', s.problema?.titulo, s.problema?.intro, s.problema?.puntos, 'problem')}

${points('La solución', s.solucion?.titulo, s.solucion?.texto, s.solucion?.beneficios, 'solution')}

${comparativa()}

${s.como_funciona ? section('Cómo funciona', `<h2>${esc(s.como_funciona.titulo)}</h2>${stepCards(s.como_funciona.pasos)}`) : ''}

${paraQuien()}

${oferta()}

${garantia()}

${s.resultados ? section('Resultados esperados', `<h2>${esc(s.resultados.titulo)}</h2><div class="stats">${list(s.resultados.cifras).map((c) => `<div class="stat reveal"><b>${esc(c.cifra)}</b><span>${esc(c.texto)}</span></div>`).join('')}</div>${s.resultados.nota ? `<p class="note">${esc(s.resultados.nota)}</p>` : ''}`, true) : ''}

${fundador()}

${list(s.faq).length ? section('Dudas frecuentes', `<h2>Preguntas frecuentes</h2><div class="faq">${list(s.faq).map((f) => `<details><summary>${esc(f.pregunta)}<span class="plus">+</span></summary><p>${esc(f.respuesta)}</p></details>`).join('')}</div>`) : ''}

<section class="sec cta-final" id="contacto"><div class="wrap center">
  ${s.cta_final?.titulo ? `<h2>${esc(s.cta_final.titulo)}</h2>` : ''}
  ${s.cta_final?.texto ? `<p class="lead">${esc(s.cta_final.texto)}</p>` : ''}
  <div class="hero-actions" style="justify-content:center">${btn(s.cta_final?.cta || s.hero?.cta || 'Quiero mi demo')}</div>
</div></section>
</main>

<footer><div class="wrap"><div class="footer-row">
  <span class="footer-brand"><span class="mono">${mono}</span>${esc(agency)}</span>
  <span class="footer-meta">${contactLine ? `${contactLine}<br>` : ''}© ${new Date().getFullYear()}${s.footer ? ` · ${esc(s.footer)}` : ''}</span>
</div></div></footer>

<div class="mobile-cta"><span class="mono">${mono}</span><span class="mc-name">${esc(agency)}</span>${btn(s.hero?.cta || 'Quiero mi demo')}</div>
</body>
</html>`
}
