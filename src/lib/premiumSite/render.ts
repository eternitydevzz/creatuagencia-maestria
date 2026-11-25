// Landing premium: la página hecha a mano por Jose (eternity-agency/index.html) convertida en plantilla.
// premium.css y premium.js son su CSS y su JS tal cual (el JS, adaptado para leer los datos de <script id="site-data">).
// Aquí solo se monta el HTML con los textos del alumno, escapados. La IA no escribe HTML.
import type { Accent, AgencyContact, PremiumSite } from '../types'
import { esc } from './esc'
import CSS from './premium.css?raw'
import JS from './premium.js?raw'

/** Colores de acento probados sobre el diseño de Jose (sustituyen al cian original #5CE1FF). */
const ACCENTS: Record<Accent, { hex: string; rgb: string }> = {
  cian: { hex: '5CE1FF', rgb: '92,225,255' },
  verde: { hex: '4EE6A8', rgb: '78,230,168' },
  violeta: { hex: 'A78BFA', rgb: '167,139,250' },
  ambar: { hex: 'FFC857', rgb: '255,200,87' },
  coral: { hex: 'FF8A7A', rgb: '255,138,122' },
}
const paint = (s: string, a: Accent) => {
  const c = ACCENTS[a] ?? ACCENTS.cian
  return s.replace(/5CE1FF/gi, c.hex).replace(/92,\s?225,\s?255/g, c.rgb)
}

const INF = 'M12 12C9.5 8.6 7.7 7.5 5.8 7.5 3.4 7.5 1.7 9.5 1.7 12s1.7 4.5 4.1 4.5c1.9 0 3.7-1.1 6.2-4.5Zm0 0c2.5 3.4 4.3 4.5 6.2 4.5 2.4 0 4.1-2 4.1-4.5s-1.7-4.5-4.1-4.5c-1.9 0-3.7 1.1-6.2 4.5Z'
const ARROW = '<svg aria-hidden="true" class="arrow"><use href="#i-arrow"/></svg>'
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check"/></svg>'
const SEP = '<svg viewBox="0 0 24 24"><use href="#inf-d" class="inf-path"/></svg>'
const ICONS = [
  '<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M8 14l2.5 2.5L16 12"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M12 21 8.5 9 12 3l3.5 6z"/></svg>',
  '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>',
  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
]

const em = (t: string, d: string) => `${esc(t)} <em>${esc(d)}</em>`
const list = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : [])
const delay = (i: number, step = 80) => (i ? ` style="--d:${i * step}ms"` : '')

/** Contacto utilizable: número solo con dígitos y email con forma de email. */
function contactOf(c: AgencyContact) {
  const wa = (c.whatsapp ?? '').replace(/\D/g, '')
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((c.email ?? '').trim()) ? (c.email ?? '').trim() : ''
  return { wa: wa.length >= 7 ? wa : '', email }
}

function logo(agency: string) {
  const [first = 'AGENCIA', ...rest] = agency.trim().split(/\s+/)
  return `<span class="logo-word"><b>${esc(first.toUpperCase())}</b><small>${esc(rest.join(' ').toUpperCase())}</small></span>`
}

function head(s: PremiumSite) {
  const icon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%2303050C'/%3E%3Cpath d='${INF.replace(/ /g, '%20')}' fill='none' stroke='%235CE1FF' stroke-width='2'/%3E%3C/svg%3E`
  return `<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.meta?.title)}</title><meta name="description" content="${esc(s.meta?.description)}">
<meta name="theme-color" content="#03050C"><link rel="icon" href="${icon}">
<style>${CSS}</style>
<script>document.documentElement.classList.add('js');if('scrollRestoration' in history){history.scrollRestoration='manual';}</script>
</head>`
}

function chrome(s: PremiumSite, agency: string) {
  return `<a class="skip" href="#main">Saltar al contenido</a>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<linearGradient id="g-inf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5CE1FF"/><stop offset=".5" stop-color="#2F6BFF"/><stop offset="1" stop-color="#8FA8FF"/></linearGradient>
<linearGradient id="g-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F6BFF" stop-opacity=".35"/><stop offset="1" stop-color="#2F6BFF" stop-opacity="0"/></linearGradient>
<path id="inf-d" d="${INF}"/></defs>
<symbol id="i-inf" viewBox="0 0 24 24"><use href="#inf-d" class="inf-path"/></symbol>
<symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></symbol></svg>
<div class="loader" id="loader" aria-hidden="true"><div class="loader-inner"><svg class="loader-inf" viewBox="0 0 24 24"><path pathLength="1" d="${INF}"/></svg>
<div class="loader-count"><span id="loader-num">000</span></div><p class="loader-label">${esc(agency)}</p></div></div>
<div class="progress" id="progress" aria-hidden="true"></div><div class="cursor-glow" id="cursor-glow" aria-hidden="true"></div><div class="grain" aria-hidden="true"></div>
<header class="nav" id="nav"><div class="container nav-inner">
<a href="#top" class="logo" aria-label="${esc(agency)}, ir al inicio"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#inf-d" class="inf-path"/><circle r=".9" class="inf-dot"><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#inf-d"/></animateMotion></circle></svg>${logo(agency)}</a>
<nav class="nav-links" aria-label="Principal"><a href="#demo" data-scramble>Demo</a><a href="#servicios" data-scramble>Servicios</a><a href="#proceso" data-scramble>Proceso</a><a href="#resultados" data-scramble>Resultados</a><a href="#faq" data-scramble>FAQ</a></nav>
<a href="#contacto" class="btn btn-primary btn-sm" data-magnetic>${esc(s.nav_cta)} ${ARROW}</a>
</div></header>`
}

function hero(s: PremiumSite) {
  const h = s.hero
  return `<section class="hero" id="top" aria-labelledby="hero-title">
<div class="aurora" aria-hidden="true"><i></i><i></i><i></i></div><canvas id="hero-canvas" aria-hidden="true"></canvas><div class="hero-vignette" aria-hidden="true"></div>
<div class="container hero-inner">
<div class="hero-top" data-hero data-reveal><span class="chip"><span class="dot"></span>${esc(h.chip)}</span></div>
<h1 class="hero-title" id="hero-title" data-split data-hero>${em(h.titulo, h.titulo_destacado)}</h1>
<div class="hero-bottom"><p class="hero-sub" data-hero data-reveal style="--d:500ms">${esc(h.subtitulo)}</p>
<div class="hero-ctas" data-hero data-reveal style="--d:650ms"><a href="#contacto" class="btn btn-primary" data-magnetic>${esc(h.cta)} <svg aria-hidden="true"><use href="#i-arrow"/></svg></a><a href="#demo" class="btn btn-ghost" data-magnetic>${esc(h.cta_secundario)}</a></div></div>
<ul class="hero-meta" data-hero data-reveal style="--d:800ms">${list(h.datos).map((d) => `<li><b>${esc(d.cifra)}</b><span>${esc(d.texto)}</span></li>`).join('')}</ul>
</div><div class="scroll-cue" aria-hidden="true">Desliza</div></section>`
}

function marquee(s: PremiumSite) {
  const a = list(s.marquee?.acciones).map((t) => `<span class="marquee-item">${esc(t)}</span>${SEP}`).join('')
  const r = list(s.marquee?.rasgos).map((t) => `<span class="marquee-item">${esc(t)}</span>`).join('')
  return `<div class="marquee" aria-hidden="true"><div class="marquee-row"><div class="marquee-group">${a}</div><div class="marquee-group">${a}</div></div>
<div class="marquee-row outline"><div class="marquee-group">${r}</div><div class="marquee-group">${r}</div></div></div>
<section class="manifesto" id="manifiesto" aria-labelledby="manifesto-label"><div class="manifesto-pin"><div class="container">
<p class="label" id="manifesto-label">(01) ${esc(s.manifiesto?.etiqueta)}</p>
<p class="manifesto-text" id="manifesto-text" style="margin-top:28px">${esc(s.manifiesto?.texto)} <span class="hl">${esc(s.manifiesto?.destacado)}</span></p>
<div class="manifesto-meta" aria-hidden="true"><div class="manifesto-bar"><i id="manifesto-bar"></i></div><span>Sigue bajando</span></div>
</div></div></section>`
}

function demo(s: PremiumSite) {
  const d = s.demo
  const steps = list(d.pasos).map((p, i) => `<li class="demo-step" data-reveal${delay(i)}><span class="n">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div></li>`).join('')
  return `<section class="section" id="demo" aria-labelledby="demo-title"><div class="container demo-grid"><div>
<p class="label" data-reveal>(02) Demo en vivo</p>
<h2 class="h2" id="demo-title" data-split style="margin-top:22px">${em(d.titulo, d.titulo_destacado)}</h2>
<p class="lead" data-reveal style="margin-top:24px">${esc(d.intro)}</p>
<ol class="demo-steps" id="demo-steps">${steps}</ol><p class="demo-caption">Conversación de ejemplo · negocio ficticio</p></div>
<div class="phone-wrap" data-reveal><div class="phone" role="img" aria-label="Simulación de un chat de WhatsApp entre un cliente y el asistente de IA de ${esc(d.negocio)}.">
<div class="screen" aria-hidden="true"><div class="chat-head"><span class="notch"></span><span class="avatar"><svg viewBox="0 0 24 24"><use href="#inf-d" fill="none" stroke="#fff" stroke-width="2"/></svg></span>
<div><b>${esc(d.negocio)} · Asistente</b><small>en línea</small></div></div>
<div class="chat-body" id="chat-body"><span class="chat-day">Hoy</span></div>
<div class="chat-input"><span>Escribe un mensaje</span><i><svg viewBox="0 0 24 24"><path d="M4 12 20 4l-6 16-3-7z" fill="#fff"/></svg></i></div></div></div>
<button class="replay" id="replay" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Repetir conversación</button>
</div></div></section>`
}

function serviceCards(s: PremiumSite) {
  const it = list(s.servicios?.items)
  const card = (i: number, cls: string, widget: string) => it[i]
    ? `<article class="card${cls}" data-reveal${delay(i % 3)}>${widget}<span class="card-icon" aria-hidden="true">${ICONS[i]}</span><h3>${esc(it[i].titulo)}</h3><p>${esc(it[i].texto)}</p></article>` : ''
  const agenda = '<div class="agenda" aria-hidden="true"><i></i><i class="b" style="--t:0s"></i><i></i><i></i><i class="b" style="--t:1.2s"></i><i></i><i class="b" style="--t:2.4s"></i><i></i><i></i><i class="b" style="--t:.6s"></i><i></i><i></i><i></i><i></i><i class="b" style="--t:3s"></i><i></i><i></i><i class="b" style="--t:1.8s"></i><i></i><i class="b" style="--t:3.6s"></i><i></i><i></i><i></i><i></i></div>'
  const notifs = `<div class="notifs" aria-hidden="true"><div class="notif" style="--t:0s">${CHECK}Recordatorio enviado · 10:30</div><div class="notif" style="--t:.8s">${CHECK}Cliente confirmó</div></div>`
  const spark = '<svg class="spark" viewBox="0 0 200 110" preserveAspectRatio="none" aria-hidden="true"><path class="f" d="M0 95 C30 92 45 80 70 78 S110 60 130 52 170 22 200 12 V110 H0Z"/><path class="l" pathLength="1" d="M0 95 C30 92 45 80 70 78 S110 60 130 52 170 22 200 12"/></svg>'
  const pills = `<div class="pills" aria-hidden="true">${list(s.servicios?.etiquetas).slice(0, 4).map((t, i) => `<span style="--t:${[0, 0.6, 1.2, 0.3][i]}s">${esc(t)}</span>`).join('')}</div>`
  const star = '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>'
  const stars = `<div class="stars" aria-hidden="true"><div>${star.repeat(5)}</div><b>4,9</b><small>EJEMPLO</small></div>`
  const first = list(s.demo?.chat)[0]
  const last = it[5] ? `<article class="card full" data-reveal><div class="bilingual"><div><span class="card-icon" aria-hidden="true">${ICONS[5]}</span><h3>${esc(it[5].titulo)}</h3><p>${esc(it[5].texto)}</p></div>
<div class="lang-box" aria-hidden="true"><span class="who" id="lang-who">Cliente</span><span id="lang-text">${esc(first?.texto)}</span><span class="caret"></span></div></div></article>` : ''
  return card(0, ' wide', agenda) + card(1, '', notifs) + card(2, '', spark) + card(3, '', pills) + card(4, '', stars) + last
}

function services(s: PremiumSite) {
  const v = s.servicios
  return `<section class="section" id="servicios" aria-labelledby="serv-title" style="padding-top:0"><div class="container">
<div class="section-head"><div><p class="label" data-reveal>(03) Servicios</p><h2 class="h2" id="serv-title" data-split>${em(v.titulo, v.titulo_destacado)}</h2></div><p class="lead" data-reveal>${esc(v.intro)}</p></div>
<div class="bento" id="bento">${serviceCards(s)}</div></div></section>`
}

function processAndResults(s: PremiumSite) {
  const p = s.proceso, r = s.resultados
  const steps = list(p.pasos).map((x, i) => `<article class="step"><span class="step-when">${esc(x.plazo)}</span><span class="step-num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(x.titulo)}</h3><p>${esc(x.texto)}</p></article>`).join('')
  const stat = (c: PremiumSite['resultados']['cifras'][number]) => {
    const dec = Number(c.decimales ?? 0)
    const shown = `${c.prefijo ?? ''}${Number(c.valor).toFixed(dec).replace('.', ',')}${c.sufijo ?? ''}`
    return `<div class="stat"><b data-count="${esc(Number(c.valor))}" data-decimals="${dec}" data-prefix="${esc(c.prefijo ?? '')}" data-suffix="${esc(c.sufijo ?? '')}">${esc(shown)}</b><span>${esc(c.texto)}</span></div>`
  }
  return `<section class="process" id="proceso" aria-labelledby="proc-title"><div class="process-pin"><div class="container"><div class="section-head" style="margin-bottom:0">
<div><p class="label" data-reveal>(04) Cómo funciona</p><h2 class="h2" id="proc-title" data-split>${em(p.titulo, p.titulo_destacado)}</h2></div>
<div style="flex:1;max-width:360px;min-width:200px" class="process-progress" aria-hidden="true"><i id="process-bar"></i></div></div></div>
<div class="process-track" id="process-track">${steps}</div></div></section>
<section class="section" id="resultados" aria-labelledby="res-title"><div class="container"><div class="section-head">
<div><p class="label" data-reveal>(05) Resultados</p><h2 class="h2" id="res-title" data-split>${em(r.titulo, r.titulo_destacado)}</h2></div>
<span class="chip chip-example" data-reveal>${esc(r.nota)}</span></div>
<div class="stats" data-reveal>${list(r.cifras).map(stat).join('')}</div></div></section>`
}

function faq(s: PremiumSite) {
  const items = list(s.faq).map((f, i) => `<div class="faq-item"><button class="faq-q" type="button" aria-expanded="false" aria-controls="fa${i + 1}" id="fq${i + 1}">${esc(f.pregunta)}<span class="pm" aria-hidden="true"></span></button>
<div class="faq-a" id="fa${i + 1}" role="region" aria-labelledby="fq${i + 1}"><div><p>${esc(f.respuesta)}</p></div></div></div>`).join('')
  return `<section class="section" id="faq" aria-labelledby="faq-title" style="padding-top:0"><div class="container faq-grid">
<div class="faq-side"><p class="label" data-reveal>(06) Preguntas</p><h2 class="h2" id="faq-title" data-split style="margin-top:22px">Lo que nos <em>preguntan.</em></h2></div>
<div class="faq-list" id="faq-list" data-reveal>${items}</div></div></section>`
}

function field(id: string, label: string, attrs: string, err: string, full = false) {
  return `<div class="field${full ? ' full' : ''}"><label for="${id}">${label}</label><input id="${id}" ${attrs} aria-describedby="e-${id.slice(2)}"><span class="err" id="e-${id.slice(2)}">${err}</span></div>`
}

function form(s: PremiumSite, agency: string, via: string) {
  return `<div class="form-card" id="form-card" data-reveal><form id="lead-form" novalidate><div class="form-grid">
${field('f-name', 'Nombre y apellido', 'name="nombre" type="text" autocomplete="name" required', 'Escribe tu nombre.')}
${field('f-business', 'Nombre de tu negocio', 'name="negocio" type="text" autocomplete="organization" required', 'Escribe el nombre de tu negocio.')}
${field('f-email', 'Email', 'name="email" type="email" autocomplete="email" inputmode="email" required', 'Revisa el email.')}
${field('f-phone', 'Teléfono / WhatsApp', 'name="telefono" type="tel" autocomplete="tel" inputmode="tel" required', 'Escribe tu teléfono.')}
<div class="field full"><label for="f-msg">¿Qué te gustaría mejorar? <span class="opt">(opcional)</span></label><textarea id="f-msg" name="mensaje"></textarea></div>
<label class="check" id="check-consent"><input type="checkbox" id="f-consent" name="consentimiento" required aria-describedby="e-consent"><span>Acepto que ${esc(agency)} me contacte por email o WhatsApp.<span class="err" id="e-consent" style="margin-top:4px">Necesitamos tu permiso para contactarte.</span></span></label>
<div class="form-foot"><small>Tus datos solo se usan para contestarte.</small><button class="btn btn-primary" type="submit" id="submit-btn" data-magnetic><span class="spinner" aria-hidden="true"></span><span id="submit-label">${esc(s.contacto?.cta)}</span>${ARROW}</button></div>
</div></form>
<div class="success" id="success" role="status" aria-live="polite"><svg viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="${INF}"/></svg>
<h3 id="success-title">¡Gracias!</h3><p>Se ha abierto ${via} con tus datos. Envía el mensaje y te contestamos lo antes posible.</p>
<button class="btn btn-ghost" type="button" id="again">Enviar otra solicitud</button></div></div>`
}

function contact(s: PremiumSite, agency: string, c: { wa: string; email: string }) {
  const k = s.contacto
  const perks = list(k.ventajas).map((v) => `<li>${CHECK}${esc(v)}</li>`).join('')
  const card = c.wa || c.email ? form(s, agency, c.wa ? 'WhatsApp' : 'tu email') : ''
  return `<section class="section contact" id="contacto" aria-labelledby="contact-title"><div class="aurora" aria-hidden="true"><i></i><i></i></div>
<div class="container contact-grid"><div><p class="label" data-reveal>(07) Empecemos</p>
<h2 class="contact-title" id="contact-title" data-split>${em(k.titulo, k.titulo_destacado)}</h2>
<p class="lead" data-reveal style="margin-top:24px">${esc(k.texto)}</p><ul class="perks" data-reveal>${perks}</ul></div>${card}</div></section>`
}

function footer(s: PremiumSite, agency: string) {
  const big = (agency.trim().split(/\s+/)[0] || 'AGENCIA').toUpperCase()
  return `<footer class="footer"><div class="container footer-row">
<a href="#top" class="logo" aria-label="${esc(agency)}, volver al inicio"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#inf-d" class="inf-path"/></svg>${logo(agency)}</a>
<small>© <span id="year">2026</span> ${esc(agency)} · ${esc(s.footer)}</small>
<a href="#top" class="to-top">Volver arriba <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></a>
</div><p class="giant" aria-hidden="true">${esc(big)}</p></footer>`
}

/** HTML completo (un solo archivo, sin recursos externos) de la landing premium del alumno. */
export function renderPremiumSite(site: PremiumSite, contactInfo: AgencyContact, agency: string): string {
  const name = agency.trim() || 'Tu agencia'
  const c = contactOf(contactInfo ?? {})
  const data = { chat: list(site.demo?.chat), confirmacion: site.demo?.confirmacion, asistente: site.demo?.asistente, cta: site.contacto?.cta, contacto: c }
  // `<` como <: ningún texto puede cerrar el <script> que lleva los datos
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  const body = [chrome(site, name), '<main id="main">', hero(site), marquee(site), demo(site), services(site), processAndResults(site), faq(site), contact(site, name, c), '</main>', footer(site, name)].join('\n')
  const html = `<!doctype html>
<html lang="es" class="loading">
${head(site)}
<body>
${body}
<script type="application/json" id="site-data">${json}</script>
<script>${JS}</script>
</body>
</html>`
  return paint(html, site.acento)
}
