// Plantilla fija de la web de la agencia: la IA solo escribe los textos (agency_site), aquí se monta el HTML premium.
// Cambiar este archivo actualiza el aspecto de TODAS las webs ya generadas (no hace falta volver a gastar créditos).
// Todas las secciones son opcionales: si la IA no devuelve una, no se pinta.
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

export function renderAgencySite(s: AgencySite, contact: AgencyContact, agency: string): string {
  const href = esc(ctaHref(contact, agency))
  // WhatsApp se abre en pestaña nueva (en la vista previa, además, no puede cargarse dentro del iframe)
  const external = href.startsWith('https://') ? ' target="_blank" rel="noopener noreferrer"' : ''
  const btn = (text: string | undefined, cls = 'btn') => text ? `<a class="${cls}" href="${href}"${external}>${esc(text)}${ICON.arrow}</a>` : ''
  const list = <T,>(xs: T[] | undefined) => (Array.isArray(xs) ? xs : [])
  const section = (kicker: string, inner: string, center = false) =>
    `<section><div class="wrap${center ? ' center' : ''}"><span class="kicker">${kicker}</span>${inner}</div></section>`

  const pointCards = (items: Point[] | undefined, variant: 'problem' | 'solution') =>
    list(items).map((p) => `<div class="pcard ${variant}"><div class="pcard-top"><span class="pcard-mark" aria-hidden="true">${variant === 'problem' ? ICON.warn : ICON.check}</span>${p.coste ? `<span class="cost">${esc(p.coste)}</span>` : ''}</div><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div>`).join('')

  const stepCards = (items: Point[] | undefined) =>
    list(items).map((p, i) => `<div class="pcard step"><div class="pcard-top"><span class="pcard-num">${i + 1}</span>${p.plazo ? `<span class="plazo">${esc(p.plazo)}</span>` : ''}</div><h3>${esc(p.titulo)}</h3><p>${esc(p.texto)}</p></div>`).join('')

  const checklist = (items: string[] | undefined, cls = 'check-list') => `<ul class="${cls}">${list(items).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`

  const comparativa = () => {
    const c = s.comparativa
    const cols = list(c?.columnas)
    const rows = list(c?.filas)
    if (!c || !cols.length || !rows.length) return ''
    const last = cols.length - 1
    return section('La comparativa', `<h2>${esc(c.titulo)}</h2><div class="table-wrap"><table class="compare"><thead><tr><th></th>${cols.map((h, i) => `<th${i === last ? ' class="hl"' : ''}>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr><th scope="row">${esc(r.aspecto)}</th>${cols.map((_, i) => `<td${i === last ? ' class="hl"' : ''}>${esc(list(r.valores)[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
  }

  const paraQuien = () => {
    const p = s.para_quien
    if (!p || (!list(p.si).length && !list(p.no).length)) return ''
    return section('Para quién es', `<h2>${esc(p.titulo)}</h2><div class="fit"><div class="fit-col yes"><h3>Es para ti si…</h3>${checklist(p.si, 'fit-list yes')}</div><div class="fit-col no"><h3>No es para ti si…</h3>${checklist(p.no, 'fit-list no')}</div></div>`)
  }

  const oferta = () => {
    const o = s.oferta
    if (!o) return ''
    // La etiqueta es una frase corta; si la IA escribió un párrafo, va como texto bajo el precio en vez de romper la etiqueta
    const short = (o.escasez ?? '').trim().length <= 60
    const badge = short && o.escasez ? o.escasez : 'Plazas limitadas cada mes'
    const urgency = [short ? '' : o.escasez, o.urgencia].filter(Boolean).join(' ')
    return `<section id="oferta"><div class="wrap center"><span class="kicker">La oferta</span><h2>${esc(o.titulo)}</h2><div class="offer-wrap"><div class="offer">
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
    ? `<section><div class="wrap"><div class="guarantee-box"><span class="g-icon">${ICON.shield}</span><div><h2>${esc(s.garantia.titulo || 'Nuestra garantía')}</h2><p>${esc(s.garantia.texto)}</p></div></div></div></section>`
    : ''

  const fundador = () => s.nota_fundador?.texto
    ? section('Quiénes somos', `<div class="founder"><h2>${esc(s.nota_fundador.titulo)}</h2><p>${esc(s.nota_fundador.texto)}</p><span class="signature">${esc(s.nota_fundador.firma || `El equipo de ${agency}`)}</span></div>`)
    : ''

  const contactLine = [contact.whatsapp && `WhatsApp: ${esc(contact.whatsapp)}`, contact.email && `Email: <a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`].filter(Boolean).join(' · ')
  const mono = esc(initials(agency))

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(s.meta?.title || agency)}</title>
<meta name="description" content="${esc(s.meta?.description)}">
<style>
  :root {
    --bg:#070a14; --panel:#0e1526; --panel-2:#0b1220; --line:rgba(255,255,255,.08); --line-soft:rgba(255,255,255,.05);
    --text:#e7ecf7; --muted:#96a3c2; --muted-2:#6f7ea3;
    --accent:#2f6df6; --accent-2:#7c6bff; --accent-text:#8fb4ff; --good:#7ee787; --bad:#ff9b9b;
    --grad: linear-gradient(135deg, var(--accent), var(--accent-2));
    --radius: 18px;
  }
  * { box-sizing:border-box } html { scroll-behavior:smooth }
  body {
    margin:0; background:var(--bg); color:var(--text); font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    line-height:1.6; -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
    background-image:
      radial-gradient(ellipse 65% 42% at 50% -8%, rgba(47,109,246,.28), transparent 68%),
      radial-gradient(ellipse 45% 30% at 100% 18%, rgba(124,107,255,.14), transparent 70%),
      linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px);
    background-size: auto, auto, 44px 44px, 44px 44px; background-attachment: fixed, fixed, fixed, fixed;
  }
  a { color:inherit } ::selection { background: rgba(47,109,246,.5); color:#fff }
  h1,h2,h3 { color:#fff; letter-spacing:-.025em; line-height:1.14; margin:0 0 .5em; font-weight:800 }
  h1 { font-size:clamp(2.1rem,5.4vw,3.6rem) } h2 { font-size:clamp(1.55rem,3.3vw,2.3rem) } h3 { font-size:1.08rem; font-weight:700 }
  p { margin:0 0 1em; color:var(--muted) }
  .wrap { max-width:1080px; margin:0 auto; padding:0 20px } .center { text-align:center }
  .kicker { display:block; font-size:.76rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--accent-text); margin-bottom:14px }
  .section-intro { max-width:640px; font-size:1.02rem } .center .section-intro { margin-left:auto; margin-right:auto }

  header { position:sticky; top:0; z-index:20; backdrop-filter:blur(14px); background:rgba(7,10,20,.72); border-bottom:1px solid var(--line-soft) }
  header .wrap { display:flex; align-items:center; justify-content:space-between; height:68px; gap:12px }
  .brand { display:flex; align-items:center; gap:10px; text-decoration:none; font-weight:800; color:#fff; font-size:1.02rem }
  .mono { display:grid; place-items:center; width:32px; height:32px; border-radius:9px; background:var(--grad); color:#fff; font-weight:800; font-size:.8rem; box-shadow: 0 4px 14px rgba(47,109,246,.35) }

  .btn { position:relative; display:inline-flex; align-items:center; gap:8px; background:var(--grad); color:#fff; text-decoration:none; font-weight:700; padding:14px 22px; border-radius:12px; box-shadow:0 10px 26px -8px rgba(47,109,246,.55), inset 0 1px 0 rgba(255,255,255,.18); transition:transform .15s ease, box-shadow .15s ease; font-size:.95rem }
  .btn:hover { transform:translateY(-1px); box-shadow:0 14px 30px -6px rgba(47,109,246,.65), inset 0 1px 0 rgba(255,255,255,.22) }
  .btn-arrow { transition:transform .15s ease } .btn:hover .btn-arrow { transform:translateX(2px) }
  .btn.sm { padding:9px 16px; font-size:.875rem; box-shadow:none } .btn.sm:hover { box-shadow:0 8px 18px -6px rgba(47,109,246,.5) }

  section { padding:88px 0; border-bottom:1px solid var(--line-soft) }
  .hero { padding:104px 0 90px; text-align:center }
  .hero h1 { background:linear-gradient(180deg,#fff 30%,#c9d6ef 100%); -webkit-background-clip:text; background-clip:text; color:transparent; max-width:900px; margin-left:auto; margin-right:auto }
  .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; font-size:.78rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--accent-text); background:rgba(47,109,246,.12); border:1px solid rgba(47,109,246,.3); padding:7px 14px 7px 10px; border-radius:999px; margin-bottom:22px }
  .hero-eyebrow .dot { width:6px; height:6px; border-radius:99px; background:var(--grad) }
  .lead { font-size:1.18rem; color:var(--muted); max-width:640px; margin:0 auto 30px }
  .note { font-size:.86rem; color:var(--muted-2); margin-top:16px }
  .proofs { display:flex; flex-wrap:wrap; justify-content:center; gap:10px 22px; margin-top:26px; padding:0; list-style:none }
  .proofs li { display:inline-flex; align-items:center; gap:7px; font-size:.86rem; color:var(--muted) } .proofs li svg { color:var(--good) }

  .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); margin-top:28px }
  .pcard { position:relative; background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01)); border:1px solid var(--line); border-radius:var(--radius); padding:26px; text-align:left; transition:transform .18s ease, border-color .18s ease }
  .pcard:hover { transform:translateY(-3px); border-color:rgba(255,255,255,.16) }
  .pcard p { margin:0; font-size:.92rem }
  .pcard-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px }
  .pcard-mark { display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:10px }
  .pcard.problem .pcard-mark { background:rgba(255,99,99,.14); color:var(--bad); border:1px solid rgba(255,99,99,.28) }
  .pcard.solution .pcard-mark { background:rgba(47,109,246,.16); color:var(--accent-text); border:1px solid rgba(47,109,246,.32) }
  .cost { font-size:.8rem; font-weight:800; color:var(--bad); background:rgba(255,99,99,.1); border:1px solid rgba(255,99,99,.22); padding:4px 10px; border-radius:999px; white-space:nowrap }
  .pcard-num { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:10px; background:var(--grad); color:#fff; font-weight:800; font-size:.92rem; box-shadow:0 6px 16px -4px rgba(47,109,246,.5) }
  .plazo { font-size:.74rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--accent-text); background:rgba(47,109,246,.12); border:1px solid rgba(47,109,246,.28); padding:4px 10px; border-radius:999px }

  .table-wrap { overflow-x:auto; margin-top:28px; border:1px solid var(--line); border-radius:var(--radius); background:rgba(255,255,255,.015) }
  .compare { width:100%; border-collapse:collapse; min-width:620px; font-size:.92rem }
  .compare th, .compare td { padding:16px 18px; text-align:left; border-bottom:1px solid var(--line-soft); vertical-align:top }
  .compare thead th { font-size:.8rem; letter-spacing:.06em; text-transform:uppercase; color:var(--muted-2); font-weight:800 }
  .compare tbody th { color:#fff; font-weight:700; width:24% } .compare td { color:var(--muted) }
  .compare tr:last-child th, .compare tr:last-child td { border-bottom:none }
  .compare .hl { background:rgba(47,109,246,.09); color:#fff } .compare thead .hl { color:var(--accent-text) }

  .fit { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); margin-top:28px }
  .fit-col { border:1px solid var(--line); border-radius:var(--radius); padding:28px; background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.008)) }
  .fit-col.yes { border-color:rgba(126,231,135,.22) } .fit-col.no { border-color:rgba(255,99,99,.18) }
  .fit-list { list-style:none; padding:0; margin:0; display:grid; gap:12px }
  .fit-list li { position:relative; padding-left:30px; color:var(--text); font-size:.95rem }
  .fit-list li::before { position:absolute; left:0; top:2px; width:20px; height:20px; border-radius:999px; display:grid; place-items:center; font-size:11px; font-weight:800 }
  .fit-list.yes li::before { content:"✓"; background:rgba(126,231,135,.16); color:var(--good) }
  .fit-list.no li::before { content:"✕"; background:rgba(255,99,99,.14); color:var(--bad) }

  .offer-wrap { max-width:780px; margin:28px auto 0; padding:1.5px; border-radius:24px; background:linear-gradient(160deg,rgba(124,107,255,.55),rgba(47,109,246,.15) 40%,rgba(255,255,255,.06)); text-align:left }
  .offer { position:relative; border-radius:22.5px; padding:40px; background:linear-gradient(180deg,var(--panel),var(--panel-2)); overflow:hidden }
  .offer::before { content:""; position:absolute; top:-40%; right:-20%; width:60%; height:80%; background:radial-gradient(circle,rgba(124,107,255,.22),transparent 70%); pointer-events:none }
  .offer-badge { display:inline-block; font-size:.72rem; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#ffd88a; background:rgba(255,190,90,.12); border:1px solid rgba(255,190,90,.3); padding:5px 12px; border-radius:999px; margin-bottom:16px }
  .offer h3 { font-size:1.55rem; margin-bottom:20px }
  .check-list { list-style:none; padding:0; margin:0 0 24px; display:grid; gap:13px }
  .check-list li { position:relative; padding-left:34px; color:var(--text); font-size:.96rem }
  .check-list li::before { content:"✓"; position:absolute; left:0; top:1px; width:22px; height:22px; border-radius:999px; background:var(--grad); color:#fff; font-size:11px; font-weight:800; display:grid; place-items:center }
  .bonus { border:1px dashed rgba(255,190,90,.35); border-radius:14px; padding:16px 18px; margin:0 0 26px; background:rgba(255,190,90,.04) }
  .bonus-t { display:block; font-size:.72rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:#ffd88a; margin-bottom:10px }
  .bonus-list { list-style:none; padding:0; margin:0; display:grid; gap:8px } .bonus-list li { color:var(--text); font-size:.92rem } .bonus-list li::before { content:"+ "; color:#ffd88a; font-weight:800 }
  .price-row { display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; margin:0 0 6px }
  .anchor { color:var(--muted-2); text-decoration:line-through; font-size:1.05rem }
  .price { font-size:2.1rem; font-weight:800; color:#fff }
  .urgency { color:#ffd88a; font-size:.9rem; margin:6px 0 4px }
  .guarantee { display:flex; align-items:flex-start; gap:8px; color:var(--muted); font-size:.88rem; margin:8px 0 24px } .guarantee svg { flex:none; color:var(--good); margin-top:3px }

  .guarantee-box { display:flex; gap:20px; align-items:flex-start; max-width:820px; margin:0 auto; padding:32px; border-radius:var(--radius); border:1px solid rgba(126,231,135,.22); background:linear-gradient(180deg,rgba(126,231,135,.06),rgba(126,231,135,.01)) }
  .guarantee-box h2 { font-size:clamp(1.3rem,2.6vw,1.7rem) } .guarantee-box p { margin:0 }
  .g-icon { flex:none; display:grid; place-items:center; width:48px; height:48px; border-radius:14px; background:rgba(126,231,135,.14); color:var(--good) }

  .stats { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); margin-top:28px }
  .stat { background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01)); border:1px solid var(--line); border-radius:var(--radius); padding:30px 20px }
  .stat b { display:block; font-size:2.3rem; font-weight:800; background:var(--grad); -webkit-background-clip:text; background-clip:text; color:transparent }
  .stat span { color:var(--muted); font-size:.9rem }

  .founder { max-width:720px; padding-left:24px; border-left:2px solid rgba(124,107,255,.5) }
  .founder p { font-size:1.08rem; color:var(--text); line-height:1.75 }
  .signature { display:block; margin-top:6px; font-weight:700; color:var(--accent-text) }

  details { border:1px solid var(--line); border-radius:14px; margin-bottom:10px; background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.008)); overflow:hidden; text-align:left }
  summary { cursor:pointer; font-weight:700; color:#fff; list-style:none; padding:18px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px }
  summary::-webkit-details-marker { display:none }
  summary .plus { flex:none; display:grid; place-items:center; width:24px; height:24px; border-radius:7px; background:rgba(255,255,255,.06); color:var(--accent-text); font-size:1.1rem; transition:transform .2s ease }
  details[open] summary .plus { transform:rotate(45deg) }
  details p { margin:0; padding:0 20px 20px; color:var(--muted) }
  .faq { max-width:820px; margin-top:28px }

  .cta-final { text-align:center; position:relative } .cta-final::before { content:""; position:absolute; inset:0; background:radial-gradient(ellipse 50% 60% at 50% 0%,rgba(47,109,246,.16),transparent 70%); pointer-events:none }
  footer { padding:40px 0 100px } .footer-row { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding-top:28px; border-top:1px solid var(--line-soft) }
  .footer-brand { display:flex; align-items:center; gap:10px; color:#fff; font-weight:700 }
  .footer-meta { color:var(--muted-2); font-size:.85rem; text-align:right }

  .mobile-cta { display:none }
  @media (max-width:720px) {
    section { padding:64px 0 } .hero { padding:80px 0 64px }
    .offer { padding:26px } .guarantee-box { flex-direction:column; padding:24px } body { padding-bottom:78px }
    .footer-meta { text-align:left }
    .mobile-cta { display:flex; position:fixed; left:0; right:0; bottom:0; z-index:30; align-items:center; gap:12px; padding:12px 16px; background:rgba(7,10,20,.88); backdrop-filter:blur(14px); border-top:1px solid var(--line) }
    .mobile-cta .mono { flex:none } .mobile-cta .mc-name { flex:1; min-width:0; font-weight:700; color:#fff; font-size:.88rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
    .mobile-cta .btn { flex:none; padding:11px 16px; font-size:.86rem }
  }
</style>
</head>
<body>
<header><div class="wrap">
  <a class="brand" href="#"><span class="mono">${mono}</span>${esc(agency)}</a>
  ${btn(s.nav_cta || s.hero?.cta, 'btn sm')}
</div></header>

<section class="hero"><div class="wrap">
  ${s.hero?.eyebrow ? `<span class="hero-eyebrow"><span class="dot"></span>${esc(s.hero.eyebrow)}</span>` : ''}
  <h1>${esc(s.hero?.titulo)}</h1>
  <p class="lead">${esc(s.hero?.subtitulo)}</p>
  ${btn(s.hero?.cta)}
  ${s.hero?.nota ? `<p class="note">${esc(s.hero.nota)}</p>` : ''}
  ${list(s.hero?.pruebas).length ? `<ul class="proofs">${list(s.hero?.pruebas).map((x) => `<li>${ICON.check}${esc(x)}</li>`).join('')}</ul>` : ''}
</div></section>

${s.problema ? section('El problema', `<h2>${esc(s.problema.titulo)}</h2>${s.problema.intro ? `<p class="section-intro">${esc(s.problema.intro)}</p>` : ''}<div class="grid">${pointCards(s.problema.puntos, 'problem')}</div>`) : ''}

${s.solucion ? section('La solución', `<h2>${esc(s.solucion.titulo)}</h2>${s.solucion.texto ? `<p class="section-intro">${esc(s.solucion.texto)}</p>` : ''}<div class="grid">${pointCards(s.solucion.beneficios, 'solution')}</div>`) : ''}

${comparativa()}

${s.como_funciona ? section('Cómo funciona', `<h2>${esc(s.como_funciona.titulo)}</h2><div class="grid">${stepCards(s.como_funciona.pasos)}</div>`) : ''}

${paraQuien()}

${oferta()}

${garantia()}

${s.resultados ? section('Resultados esperados', `<h2>${esc(s.resultados.titulo)}</h2><div class="stats">${list(s.resultados.cifras).map((c) => `<div class="stat"><b>${esc(c.cifra)}</b><span>${esc(c.texto)}</span></div>`).join('')}</div>${s.resultados.nota ? `<p class="note">${esc(s.resultados.nota)}</p>` : ''}`, true) : ''}

${fundador()}

${list(s.faq).length ? section('Dudas frecuentes', `<h2>Preguntas frecuentes</h2><div class="faq">${list(s.faq).map((f) => `<details><summary>${esc(f.pregunta)}<span class="plus">+</span></summary><p>${esc(f.respuesta)}</p></details>`).join('')}</div>`) : ''}

<section class="cta-final" id="contacto"><div class="wrap">
  <h2>${esc(s.cta_final?.titulo)}</h2>
  <p class="lead">${esc(s.cta_final?.texto)}</p>
  ${btn(s.cta_final?.cta || s.hero?.cta)}
</div></section>

<footer><div class="wrap"><div class="footer-row">
  <span class="footer-brand"><span class="mono">${mono}</span>${esc(agency)}</span>
  <span class="footer-meta">${contactLine ? `${contactLine}<br>` : ''}© ${new Date().getFullYear()}${s.footer ? ` · ${esc(s.footer)}` : ''}</span>
</div></div></footer>

<div class="mobile-cta"><span class="mono">${mono}</span><span class="mc-name">${esc(agency)}</span>${btn(s.hero?.cta || 'Quiero mi demo')}</div>
</body>
</html>`
}
