// JavaScript de la landing de Jose (eternity-agency/index.html), adaptado para MaestrIA: los textos que cambian por
// alumno (conversación de la demo, contacto) se leen de <script type="application/json" id="site-data">.
(() => {
  'use strict';
  let DATA = {};
  try { DATA = JSON.parse(document.getElementById('site-data').textContent || '{}'); } catch { DATA = {}; }
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const TAU = Math.PI * 2;

  /* ---------- Dividir títulos en palabras ---------- */
  function splitWords(el) {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            const inner = document.createElement('span');
            w.className = 'w';
            inner.textContent = part;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
        }
      });
    };
    walk(el);
  }
  $$('[data-split]').forEach(splitWords);

  /* ---------- Revelado al hacer scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  $$('[data-reveal],[data-split]').forEach((el) => { if (!el.hasAttribute('data-hero')) revealIO.observe(el); });

  function revealHero() { $$('[data-hero]').forEach((el) => el.classList.add('in')); }

  /* ---------- Preloader ---------- */
  function runLoader() {
    const loader = $('#loader');
    const num = $('#loader-num');
    const path = $('.loader-inf path');
    const finish = () => {
      document.documentElement.classList.remove('loading');
      loader.classList.add('done');
      setTimeout(revealHero, 250);
      setTimeout(() => loader.remove(), 1300);
    };
    if (reduced) { loader.remove(); document.documentElement.classList.remove('loading'); revealHero(); return; }
    const DURATION = 1500;
    const start = performance.now();
    const tick = (now) => {
      const p = clamp((now - start) / DURATION);
      const e = 1 - Math.pow(1 - p, 3);
      num.textContent = String(Math.round(e * 100)).padStart(3, '0');
      path.style.strokeDashoffset = String(1 - e);
      if (p < 1) requestAnimationFrame(tick); else setTimeout(finish, 180);
    };
    requestAnimationFrame(tick);
    setTimeout(() => { if (document.documentElement.classList.contains('loading')) finish(); }, 4000);
  }

  /* ---------- Hero: infinito de partículas en 3D ---------- */
  const hero = { scrollP: 0 };
  function initHeroCanvas() {
    const canvas = $('#hero-canvas');
    const ctx = canvas.getContext('2d');
    const small = matchMedia('(max-width: 760px)').matches;
    const COUNT = small ? 700 : 1600;
    const COLORS = ['#2F6BFF', '#5CE1FF', '#7C96FF', '#EAF2FF'];
    const WEIGHTS = [0.5, 0.3, 0.15, 0.05];
    const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const pickColor = () => {
      let r = Math.random();
      for (let k = 0; k < WEIGHTS.length; k++) { r -= WEIGHTS[k]; if (r <= 0) return k; }
      return 0;
    };
    const parts = Array.from({ length: COUNT }, () => ({
      t: Math.random() * TAU,
      v: 0.00016 + Math.random() * 0.00034,
      ox: gauss(), oy: gauss(), oz: gauss(),
      spread: Math.random() < 0.82 ? 0.045 : 0.16,
      s: 0.6 + Math.random() * 1.3,
      a: 0.35 + Math.random() * 0.65,
      c: pickColor(), dx: 0, dy: 0,
    })).sort((a, b) => a.c - b.c);
    const comets = [0, 2.1, 4.2].map((t) => ({ t, v: 0.0009 }));

    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext('2d');
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(92,225,255,.85)');
    g.addColorStop(0.5, 'rgba(47,107,255,.25)');
    g.addColorStop(1, 'rgba(47,107,255,0)');
    sctx.fillStyle = g; sctx.fillRect(0, 0, 64, 64);

    const mouse = { x: -1e4, y: -1e4 };
    let W = 0, H = 0, last = performance.now(), inView = true, running = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function project(t, ox, oy, oz, spread, A, rot) {
      const st = Math.sin(t), ct = Math.cos(t), d = 1 + st * st;
      let x = (A * ct) / d, y = (A * st * ct) / d, z = A * 0.34 * st;
      const k = A * spread * (1 + hero.scrollP * 3.5);
      x += ox * k; y += oy * k; z += oz * k;
      const y2 = y * rot.cX - z * rot.sX, z2 = y * rot.sX + z * rot.cX;
      const x3 = x * rot.cY + z2 * rot.sY, z3 = -x * rot.sY + z2 * rot.cY;
      const sc = 900 / (900 + z3);
      return { x: rot.cx + x3 * sc, y: rot.cy + y2 * sc, sc };
    }

    function draw(now, dt) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = dt === 0 ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0.24)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const A = Math.min(W * (small ? 0.46 : 0.36), H * 0.62);
      const ry = Math.sin(now * 0.00022) * 0.55, rx = 0.32 + Math.sin(now * 0.00016) * 0.14;
      const rot = { cX: Math.cos(rx), sX: Math.sin(rx), cY: Math.cos(ry), sY: Math.sin(ry), cx: W * (small ? 0.5 : 0.6), cy: small ? Math.min(H * 0.3, 190) : H * 0.38 };
      const fade = 1 - hero.scrollP * 0.9;
      const R = small ? 90 : 140;
      let color = -1;
      for (const p of parts) {
        p.t += p.v * dt;
        const q = project(p.t, p.ox, p.oy, p.oz, p.spread, A, rot);
        const mx = q.x + p.dx - mouse.x, my = q.y + p.dy - mouse.y;
        const dist = Math.hypot(mx, my);
        if (dist < R && dist > 0.1) {
          const f = (1 - dist / R) * 2.4;
          p.dx += (mx / dist) * f; p.dy += (my / dist) * f;
        }
        p.dx *= 0.94; p.dy *= 0.94;
        if (p.c !== color) { color = p.c; ctx.fillStyle = COLORS[color]; }
        ctx.globalAlpha = p.a * fade * clamp(0.35 + (q.sc - 0.75) * 1.4, 0.15, 1);
        const size = p.s * q.sc;
        ctx.fillRect(q.x + p.dx, q.y + p.dy, size, size);
      }
      for (const c of comets) {
        c.t += c.v * dt;
        const q = project(c.t, 0, 0, 0, 0, A, rot);
        const s = 34 * q.sc;
        ctx.globalAlpha = 0.9 * fade;
        ctx.drawImage(sprite, q.x - s / 2, q.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }

    function loop(now) {
      if (!inView || document.hidden) { running = false; return; }
      const dt = Math.min(now - last, 50);
      last = now;
      draw(now, dt);
      requestAnimationFrame(loop);
    }
    function start() { if (running || reduced) return; running = true; last = performance.now(); requestAnimationFrame(loop); }

    // Movimiento reducido: un fotograma fijo, acumulado para que tenga la misma intensidad que el animado.
    function drawStatic() {
      const t = performance.now();
      draw(t, 0);
      for (let i = 1; i < 14; i++) draw(t + i * 16, 16);
    }

    resize();
    if (reduced) drawStatic();
    else start();

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduced) drawStatic(); }, 120); });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) start(); }).observe(canvas);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
    window.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  }

  /* ---------- Manifiesto: palabras que se encienden ---------- */
  const manifesto = { section: $('#manifiesto'), words: [], bar: $('#manifesto-bar') };
  (function splitManifesto() {
    const el = $('#manifesto-text');
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'mw'; s.textContent = part;
            manifesto.words.push(s);
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  })();

  /* ---------- Proceso: scroll horizontal ---------- */
  const proc = { section: $('#proceso'), track: $('#process-track'), bar: $('#process-bar'), overflow: 0, active: false };
  const desktopMQ = matchMedia('(min-width: 900px)');
  function layoutProcess() {
    proc.active = desktopMQ.matches && !reduced;
    if (!proc.active) { proc.section.style.height = ''; proc.track.style.transform = ''; return; }
    proc.overflow = Math.max(0, proc.track.scrollWidth - window.innerWidth);
    proc.section.style.height = (proc.overflow + window.innerHeight) + 'px';
  }

  /* ---------- Bucle de scroll ---------- */
  const nav = $('#nav');
  const progress = $('#progress');
  const heroEl = $('.hero');
  let lastY = window.scrollY, ticking = false;
  function onScrollFrame() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${docH > 0 ? y / docH : 0})`;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hidden', y > lastY && y > 600);
    lastY = y;
    hero.scrollP = clamp(y / heroEl.offsetHeight);

    if (!reduced) {
      const r = manifesto.section.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - vh));
      const n = manifesto.words.length;
      manifesto.words.forEach((w, i) => { w.style.opacity = String(0.12 + 0.88 * clamp(p * n * 1.15 - i)); });
      manifesto.bar.style.transform = `scaleX(${p})`;
    }
    if (proc.active) {
      const r = proc.section.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, proc.overflow));
      proc.track.style.transform = `translate3d(${-p * proc.overflow}px,0,0)`;
      proc.bar.style.transform = `scaleX(${p})`;
    }
  }
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); } };
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', () => { layoutProcess(); requestScroll(); });

  /* ---------- Demo de chat ---------- */
  // MaestrIA: la conversación sale de los datos de la landing (<script id="site-data">), no de un texto fijo.
  const SRC = Array.isArray(DATA.chat) ? DATA.chat : [];
  const CHAT = [];
  SRC.forEach((m, i) => {
    const item = { from: m.de === 'agente' ? 'a' : 'p', text: String(m.texto || ''), time: String(m.hora || ''), step: Math.min(3, Math.floor((i * 4) / SRC.length)) };
    if (Array.isArray(m.huecos) && m.huecos.length) item.slots = m.huecos.slice(0, 3).map(String);
    const prev = CHAT[CHAT.length - 1];
    if (item.from === 'p' && prev && prev.slots) {
      const k = prev.slots.findIndex((s) => item.text.toLowerCase().includes(s.toLowerCase().split(' ').pop()));
      item.pick = k >= 0 ? k : 0;
    }
    CHAT.push(item);
  });
  if (DATA.confirmacion && CHAT.length) CHAT.splice(CHAT.length - 1, 0, { from: 'a', card: true, step: 3 });
  const chatBody = $('#chat-body');
  const steps = $$('.demo-step');
  let chatRun = 0;
  function setStep(i) { steps.forEach((s, k) => s.classList.toggle('active', k === i)); }
  function bubble(m) {
    if (m.card) {
      const c = document.createElement('div');
      c.className = 'confirm';
      c.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#3DDC97" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m7.5 12.5 3 3 6-6.5"/></svg><div><b></b><span></span></div>';
      c.querySelector('b').textContent = String(DATA.confirmacion.titulo || '');
      c.querySelector('span').textContent = String(DATA.confirmacion.detalle || '');
      return c;
    }
    const b = document.createElement('div');
    b.className = 'msg ' + m.from;
    const p = document.createElement('div');
    p.textContent = m.text;
    b.appendChild(p);
    if (m.slots) {
      const s = document.createElement('div');
      s.className = 'slots';
      m.slots.forEach((t) => { const x = document.createElement('span'); x.textContent = t; s.appendChild(x); });
      b.appendChild(s);
    }
    const t = document.createElement('time');
    t.textContent = m.time;
    b.appendChild(t);
    return b;
  }
  async function playChat() {
    const run = ++chatRun;
    chatBody.querySelectorAll('.msg,.confirm,.typing').forEach((n) => n.remove());
    setStep(-1);
    if (reduced) { CHAT.forEach((m) => chatBody.appendChild(bubble(m))); setStep(3); return; }
    for (const m of CHAT) {
      if (run !== chatRun) return;
      if (m.from === 'a') {
        const typing = document.createElement('div');
        typing.className = 'typing';
        typing.innerHTML = '<i></i><i></i><i></i>';
        chatBody.appendChild(typing);
        await wait(m.card ? 700 : 1300);
        typing.remove();
      } else {
        await wait(1000);
      }
      if (run !== chatRun) return;
      if (m.pick !== undefined) {
        const slot = chatBody.querySelectorAll('.slots span')[m.pick];
        if (slot) slot.classList.add('pick');
      }
      chatBody.appendChild(bubble(m));
      if (m.step !== undefined) setStep(m.step);
      await wait(350);
    }
  }
  new IntersectionObserver((entries, io) => {
    if (entries[0].isIntersecting) { playChat(); io.disconnect(); }
  }, { threshold: 0.35 }).observe($('.phone'));
  $('#replay').addEventListener('click', playChat);

  /* ---------- Tarjetas: foco de luz ---------- */
  const bento = $('#bento');
  bento.addEventListener('pointermove', (e) => {
    $$('.card', bento).forEach((c) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', `${e.clientX - r.left}px`);
      c.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Tarjeta bilingüe ---------- */
  (function bilingual() {
    const who = $('#lang-who'), text = $('#lang-text');
    // MaestrIA: las líneas salen de la conversación de la demo
    const LINES = SRC.slice(0, 4).map((m) => [m.de === 'agente' ? String(DATA.asistente || 'Asistente') : 'Cliente', String(m.texto || '')]);
    if (reduced || !who || LINES.length < 2) return;
    let i = 0;
    const type = async () => {
      i = (i + 1) % LINES.length;
      const [w, line] = LINES[i];
      who.textContent = w;
      for (let k = 0; k <= line.length; k++) { text.textContent = line.slice(0, k); await wait(28); }
      setTimeout(type, 2400);
    };
    setTimeout(type, 2400);
  })();

  /* ---------- Contadores ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
      const fmt = (v) => pre + v.toFixed(dec).replace('.', ',') + suf;
      if (reduced) { el.textContent = fmt(target); return; }
      const start = performance.now(), DUR = 2000;
      const tick = (now) => {
        const p = clamp((now - start) / DUR);
        el.textContent = fmt(target * (1 - Math.pow(2, -10 * p)));
        if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- FAQ ---------- */
  $$('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Formulario ---------- */
  // MaestrIA: si el alumno no tiene WhatsApp ni email, la plantilla no pinta el formulario
  const form = $('#lead-form');
  if (form) {
  const card = $('#form-card');
  const RULES = {
    'f-name': (v) => v.trim().length >= 2,
    'f-business': (v) => v.trim().length >= 2,
    'f-email': (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    'f-phone': (v) => v.replace(/\D/g, '').length >= 7,
  };
  function validateField(id) {
    const input = $('#' + id);
    const ok = RULES[id](input.value);
    input.closest('.field').classList.toggle('invalid', !ok);
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  function validateConsent() {
    const box = $('#f-consent');
    $('#check-consent').classList.toggle('invalid', !box.checked);
    $('#e-consent').style.display = box.checked ? 'none' : 'block';
    box.setAttribute('aria-invalid', String(!box.checked));
    return box.checked;
  }
  Object.keys(RULES).forEach((id) => {
    const input = $('#' + id);
    input.addEventListener('blur', () => { if (input.value) validateField(id); });
    input.addEventListener('input', () => { if (input.closest('.field').classList.contains('invalid')) validateField(id); });
    input.addEventListener('change', () => { if (input.tagName === 'SELECT') validateField(id); });
  });
  $('#f-consent').addEventListener('change', () => { if ($('#check-consent').classList.contains('invalid')) validateConsent(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const results = Object.keys(RULES).map((id) => [id, validateField(id)]);
    const consentOk = validateConsent();
    const firstBad = results.find(([, ok]) => !ok);
    if (firstBad) { $('#' + firstBad[0]).focus(); return; }
    if (!consentOk) { $('#f-consent').focus(); return; }

    const btn = $('#submit-btn');
    btn.disabled = true;
    btn.classList.add('loading-btn');
    $('#submit-label').textContent = 'Enviando…';
    // MaestrIA: envío real. Con WhatsApp abre una conversación con los datos ya escritos; si no, un email.
    const v = (id) => $('#' + id).value.trim();
    const lines = [`Hola, soy ${v('f-name')} de ${v('f-business')}.`, `Email: ${v('f-email')}`, `Teléfono: ${v('f-phone')}`];
    if (v('f-msg')) lines.push(v('f-msg'));
    const text = lines.join('\n');
    const contact = DATA.contacto || {};
    if (contact.wa) window.open('https://wa.me/' + contact.wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    else if (contact.email) window.open('mailto:' + contact.email + '?subject=' + encodeURIComponent('Quiero una demo') + '&body=' + encodeURIComponent(text), '_blank');
    await wait(600);
    const first = v('f-name').split(/\s+/)[0];
    $('#success-title').textContent = `¡Gracias, ${first}!`;
    card.classList.add('sent');
    btn.disabled = false;
    btn.classList.remove('loading-btn');
    $('#submit-label').textContent = String(DATA.cta || 'Enviar');
  });
  $('#again').addEventListener('click', () => {
    form.reset();
    $$('.field.invalid', form).forEach((f) => f.classList.remove('invalid'));
    card.classList.remove('sent');
    $('#f-name').focus();
  });
  $('#e-consent').style.display = 'none';
  }

  /* ---------- Botones magnéticos ---------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.32}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Luz del cursor ---------- */
  if (finePointer && !reduced) {
    const glow = $('#cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy, moving = false;
    document.documentElement.classList.add('has-pointer');
    const follow = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx}px,${gy}px,0)`;
      if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.5) requestAnimationFrame(follow); else moving = false;
    };
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!moving) { moving = true; requestAnimationFrame(follow); }
    }, { passive: true });
  }

  /* ---------- Efecto "scramble" en el menú ---------- */
  if (!reduced) {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ∞';
    $$('[data-scramble]').forEach((a) => {
      const original = a.textContent;
      a.addEventListener('mouseenter', () => {
        let frame = 0;
        const total = original.length * 3;
        const iv = setInterval(() => {
          a.textContent = original.split('').map((ch, i) => (i < frame / 3 ? ch : CHARS[Math.floor(Math.random() * CHARS.length)])).join('');
          if (++frame > total) { clearInterval(iv); a.textContent = original; }
        }, 22);
      });
    });
  }

  /* ---------- Arranque ---------- */
  $('#year').textContent = String(new Date().getFullYear());
  layoutProcess();
  onScrollFrame();
  initHeroCanvas();
  runLoader();
})();
