# MaestrIA agencia real — Plan de implementación

> **Para quien ejecute:** este plan se ejecuta en la sesión principal, tarea a tarea, con superpowers:executing-plans.
> Jose no quiere subagentes (CLAUDE.md, "Sin agentes"). Los pasos usan casillas (`- [ ]`) para marcar el avance.

**Objetivo:** que un alumno real genere con Claude, con sus datos, su landing al nivel de la de Jose, su contenido (reels,
bio, carruseles) y sus anuncios de Meta, sin romper los proyectos que ya existen.

**Arquitectura:** la landing de Jose (`eternity-agency/index.html`) se convierte en una plantilla. El CSS y el JS se
copian tal cual y Claude solo rellena un JSON de textos. Contenido y anuncios son dos tipos nuevos de generación en la
función `generate`, con sus columnas jsonb en `roadmaps` y dos pasos nuevos en el mapa. Todo pasa por el mismo sistema
de créditos, validación y devolución que ya existe.

**Tecnología:** React 18 + Vite + TypeScript (web), Supabase Edge Functions en Deno (IA), Postgres (Supabase), Vercel.
Pruebas: Vitest para `src/`, `deno test` para `supabase/functions/`, `scripts/e2e.mjs` contra Supabase local con el
simulador de Anthropic.

**Diseño:** [docs/superpowers/specs/2026-11-25-agencia-real-design.md](../specs/2026-11-25-agencia-real-design.md)

## Reglas para todo el plan

- Trabajo en la rama `agencia-real`. Nunca push a `main` hasta la tarea 10 (cada push a `main` despliega a producción).
- Créditos: `agency_content` 3, `agency_ads` 3. Los demás no cambian.
- Formato viejo de `agency_site` (sin `plantilla`): se sigue pintando con `renderAgencySite` de siempre. Solo
  `plantilla: 'premium'` usa la plantilla nueva.
- Las funciones de Supabase se despliegan en producción (no hay otro entorno): cada cambio admite el formato viejo y el nuevo.
- Nada de testimonios, clientes ni logos inventados (system prompt actual, `prompts.ts:70`). Cifras no dadas = estimación.
- Idioma y mercado según la moneda del proyecto (`_shared/currency.ts`), como hoy.
- Color de acento: solo `cian | verde | violeta | ambar | coral`.
- **Punto de control tras la tarea 7: se para y Jose revisa la pasada de punta a punta antes de seguir.**

## Puntos a vigilar (fallos que el diseño no menciona y más pueden doler)

1. **Proyectos guardados con la landing vieja**: tienen que verse y descargarse igual que hoy → prueba en la tarea 4.
2. **Texto con `<`, `"`, `</script>` o emojis** (nombre de la agencia o lo que escriba la IA): se escapa en el HTML y no rompe
   el JSON que va dentro del `<script>` → prueba en la tarea 2.
3. **Alumno sin WhatsApp ni email**: el formulario y los botones no pueden enlazar a `wa.me/` vacío → prueba en la tarea 2.
4. **Contenido o anuncios pedidos sin oferta hecha**: error claro **antes** de cobrar, nunca cobrar y fallar → prueba en la tarea 5.
5. **Proyecto en euros**: contenido y anuncios para España, sin "$" ni "hispanos en EE. UU." → prueba en las tareas 5 y 8.

---

## FASE 1 — Pasada de punta a punta (termina en el punto de control)

### Tarea 1: CORS con varios dominios

Para que la preview de Vercel de la rama pueda llamar a las funciones de producción.

**Archivos:**
- Modificar: `supabase/functions/_shared/cors.ts`
- Modificar: las 5 funciones que usan `corsHeaders`/`json` (`generate`, `agent-chat`, `admin-students`, `load-sample`, `wa-connect`)
- Crear: `supabase/functions/_shared/cors.test.ts`

**Interfaces:**
- Produce: `allowOrigin(origin: string | null, allowed: string): string` y `corsFor(req: Request): Record<string, string>`;
  `json(body: unknown, status?: number, req?: Request): Response`.

- [ ] **Paso 1: Prueba que falla** (`cors.test.ts`):
  `allowOrigin('https://a.app', 'https://a.app,https://b.app') === 'https://a.app'`;
  `allowOrigin('https://x.app', 'https://a.app,https://b.app') === 'https://a.app'` (si no está, devuelve el primero);
  `allowOrigin(null, '*') === '*'`; `allowOrigin('https://b.app', ' https://a.app , https://b.app ') === 'https://b.app'`.
- [ ] **Paso 2:** `deno test supabase/functions/_shared/cors.test.ts` → FALLA (no existe `allowOrigin`).
- [ ] **Paso 3:** implementar. `ALLOWED_ORIGIN` pasa a admitir una lista separada por comas. Las 5 funciones usan
  `corsFor(req)` en el `OPTIONS` y en sus respuestas. Se mantiene `Vary: Origin`.
- [ ] **Paso 4:** `deno test supabase/functions/_shared/` → PASA. `pnpm build` → sin errores.
- [ ] **Paso 5:** commit `feat: CORS admite varios dominios (producción y preview de la rama)`.

### Tarea 2: Plantilla premium (la landing de Jose)

**Archivos:**
- Crear: `src/lib/premiumSite/assets.ts`: CSS y JS de `eternity-agency/index.html` copiados tal cual, como constantes
  `PREMIUM_CSS` y `PREMIUM_JS`. Archivo copiado (vendored): puede pasar de 800 líneas.
- Crear: `src/lib/premiumSite/render.ts`
- Crear: `src/lib/premiumSite/render.test.ts`
- Modificar: `src/lib/types.ts` (tipo `PremiumSite`)
- Modificar: `package.json`: devDependency `vitest` y script `"test": "vitest run"`

**Interfaces:**
- Produce el tipo (en `types.ts`), que comparten las tareas 3, 4 y 9:
```ts
export type Accent = 'cian' | 'verde' | 'violeta' | 'ambar' | 'coral'
export interface PremiumSite {
  plantilla: 'premium'
  acento: Accent
  meta: { title: string; description: string }
  nav_cta: string
  hero: { chip: string; titulo: string; titulo_destacado: string; subtitulo: string; cta: string; cta_secundario: string; datos: Array<{ cifra: string; texto: string }> } // datos: 3
  marquee: { acciones: string[]; rasgos: string[] }                                   // 4 y 4
  manifiesto: { etiqueta: string; texto: string; destacado: string }
  demo: { titulo: string; titulo_destacado: string; intro: string; pasos: Array<{ titulo: string; texto: string }>; // pasos: 4
          negocio: string; asistente: string;
          chat: Array<{ de: 'cliente' | 'agente'; texto: string; hora: string; huecos?: string[] }>;           // 5-7 mensajes
          confirmacion: { titulo: string; detalle: string } }
  servicios: { titulo: string; titulo_destacado: string; intro: string; items: Array<{ titulo: string; texto: string }>; etiquetas: string[] } // items 6, etiquetas 4
  proceso: { titulo: string; titulo_destacado: string; pasos: Array<{ plazo: string; titulo: string; texto: string }> } // 4
  resultados: { titulo: string; titulo_destacado: string; nota: string; cifras: Array<{ valor: number; prefijo?: string; sufijo?: string; decimales?: number; texto: string }> } // 4
  faq: Array<{ pregunta: string; respuesta: string }>                                 // 6
  contacto: { titulo: string; titulo_destacado: string; texto: string; ventajas: string[]; cta: string } // ventajas 3 (una es la garantía)
  footer: string
  _meta?: DeliverableMeta
}
```
- Produce: `renderPremiumSite(site: PremiumSite, contact: AgencyContact, agency: string): string` (HTML completo, un solo archivo).

**Decisiones fijadas (marcadas para que Jose las revise en el punto de control):**
- Fuera los 3 casos con testimonios inventados (sección "cases"). Se quedan las 4 cifras con la `nota` de estimación.
- El formulario envía de verdad: con WhatsApp abre `https://wa.me/<número>?text=<datos del formulario>`; sin WhatsApp y con
  email, `mailto:`; sin ninguno de los dos, se oculta el formulario y los botones van a `#contacto`. Los campos dejan de
  ser de clínica: nombre, negocio, email, teléfono (sin validar formato de EE. UU.) y mensaje.
- "ETERNITY", "Eternity Agency" y el texto gigante del pie se cambian por el nombre de la agencia. El logo de las iniciales
  usa la misma función `initials` que `agencySite.ts`.
- `CHAT`, `LINES` (tarjeta bilingüe) y los textos del JS salen de un `<script type="application/json" id="site-data">`
  que el JS lee al arrancar. La tarjeta bilingüe pasa a ser el 6.º servicio, con las líneas del chat.
- Acento: cada color del tipo `Accent` sustituye las variables de color de acento del CSS de Jose (`#5CE1FF` y sus
  derivadas). `cian` = el original.

- [ ] **Paso 1: Pruebas que fallan** (`render.test.ts`, con un `PremiumSite` de ejemplo completo):
  - `renderPremiumSite_noDejaRastroDeEternity`: el HTML no contiene `Eternity`, `ETERNITY`, `Clínica Brisa` ni `Miami`.
  - `escapaTexto`: con agencia `A<b>"&` el HTML contiene `A&lt;b&gt;&quot;&amp;` y no contiene `<b>"`.
  - `jsonSeguroEnScript`: con un texto del chat `</script><script>alert(1)` el bloque `site-data` no contiene `</script><script>`.
  - `formularioAWhatsapp`: con `contact.whatsapp = '34 600-000-000'` el HTML contiene `wa.me/34600000000`.
  - `sinContactoNoHayWaMeVacio`: con `contact = {}` el HTML no contiene `wa.me/?` ni `wa.me/"`, y no contiene `id="lead-form"`.
  - `acentoCambiaColor`: con `acento: 'verde'` el HTML no contiene `#5CE1FF`.
  - `pintaTodasLasSecciones`: contiene `id="top"`, `id="manifiesto"`, `id="demo"`, `id="servicios"`, `id="proceso"`,
    `id="resultados"`, `id="faq"`, `id="contacto"` y el `hero.titulo` del ejemplo.
- [ ] **Paso 2:** `pnpm test` → FALLA (no existe el módulo).
- [ ] **Paso 3:** crear `assets.ts` copiando del original (con el `CHAT`, las `LINES` y el envío del formulario cambiados
  según las decisiones de arriba) y escribir `renderPremiumSite`. Escapar con la misma `esc` de `agencySite.ts`
  (moverla a `src/lib/premiumSite/esc.ts` y que la usen los dos). Dentro del JSON, `<` se escribe como `<`.
- [ ] **Paso 4:** `pnpm test` → PASA. Abrir el HTML de ejemplo en el navegador (Playwright): 0 errores en consola, la
  conversación de la demo se reproduce y el formulario abre `wa.me`.
- [ ] **Paso 5:** commit `feat: plantilla premium de landing basada en la página de Jose`.

### Tarea 3: La IA escribe la landing premium

**Archivos:**
- Modificar: `supabase/functions/generate/prompts.ts` (`agencySite` pide el JSON `PremiumSite`)
- Modificar: `supabase/functions/generate/index.ts` (`KINDS.agency_site.valid`)
- Crear: `supabase/functions/generate/prompts.test.ts`
- Modificar: `scripts/mock-samples.mjs` (`SITE` pasa al formato premium) y `scripts/e2e.mjs:122-123`

**Interfaces:**
- Consume: el tipo `PremiumSite` de la tarea 2 (el prompt describe exactamente esos campos y cantidades).
- Produce: `agencySitePremium(c: Ctx): string` (prompt nuevo). El prompt actual se queda como está (`agencySite`).
  `agency_site` sale en formato premium **solo si la petición trae `params.plantilla === 'premium'`**; sin ese parámetro,
  formato viejo, como hoy.
- **Por qué:** la función se despliega en producción en la tarea 6, pero la web de producción (`main`) no sabrá pintar el
  formato premium hasta la tarea 10. Sin esta condición, un alumno real que generase su landing en ese tiempo la vería rota.

- [ ] **Paso 1: Pruebas que fallan:**
  - `prompts.test.ts`: `agencySitePremium(ctx)` contiene `"plantilla": "premium"`, `"demo"`, `"chat"` y
    `cian | verde | violeta | ambar | coral`, y NO contiene `"direccion"` ni `tech-blue`. `agencySite(ctx)` no cambia (sigue
    conteniendo `tech-blue`).
  - `e2e.mjs`: `agency_site` **sin** parámetro → se guarda con `hero.titulo` y sin `plantilla` (formato viejo);
    **con** `{ plantilla: 'premium' }` → `plantilla === 'premium'` y `demo.chat.length >= 5`.
- [ ] **Paso 2:** `deno test supabase/functions/generate/prompts.test.ts` → FALLA.
- [ ] **Paso 3:** escribir `agencySitePremium` con la misma voz y las mismas reglas de copy de hoy, para el JSON de la
  tarea 2. La conversación de la demo sale del cliente ideal y de la oferta (diseño, decisión 1). En `index.ts`, según el
  parámetro, se elige el prompt y la validación: premium → `plantilla === 'premium'`, `hero.titulo` con texto,
  `demo.chat` con 5 mensajes o más y `faq` con 6; viejo → la validación de hoy. El simulador distingue los dos prompts y
  devuelve `SITE` (viejo) o `SITE_PREMIUM` (nuevo, en `mock-samples.mjs`).
- [ ] **Paso 4:** `deno test supabase/functions/` → PASA. Con Supabase local + simulador: `pnpm mock` y `node scripts/e2e.mjs` → 0 ❌.
- [ ] **Paso 5:** commit `feat: la IA escribe la landing premium`.

### Tarea 4: La app enseña y descarga la landing premium

**Archivos:**
- Modificar: `src/components/sections/S6Landing.tsx:19-20,47-48`
- Crear: `src/lib/siteHtml.ts` + `src/lib/siteHtml.test.ts`

**Interfaces:**
- Consume: `renderPremiumSite` (tarea 2) y `renderAgencySite` (actual).
- Produce: `siteHtml(site: AgencySite | PremiumSite, contact: AgencyContact, agency: string): { html: string; scripts: boolean }`.

- [ ] **Paso 1: Pruebas que fallan** (`siteHtml.test.ts`): con `plantilla: 'premium'` → `scripts === true` y el HTML viene de
  la plantilla premium; **con un `agency_site` viejo (el `SITE` antiguo de `mock-samples.mjs`, sin `plantilla`) →
  `scripts === false` y el HTML es idéntico a `renderAgencySite(...)`**; con `html` propio → ese HTML y `scripts === true`.
- [ ] **Paso 2:** `pnpm test` → FALLA.
- [ ] **Paso 3:** implementar `siteHtml` y usarla en `S6Landing`. `sandbox` con `allow-scripts` solo si `scripts` (nunca
  `allow-same-origin`). Al generar la landing, `S6Landing` manda `params: { plantilla: 'premium' }` (tarea 3).
- [ ] **Paso 4:** `pnpm test` y `pnpm build` → PASAN.
- [ ] **Paso 5:** commit `feat: la app muestra la landing premium y mantiene las antiguas`.

### Tarea 5: Contenido (reels, bio, carruseles)

**Archivos:**
- Crear: `supabase/migrations/20261126000001_content_ads.sql`: columnas `agency_content jsonb not null default '{}'` y
  `agency_ads jsonb not null default '{}'` en `roadmaps` (las dos en una sola migración).
- Modificar: `supabase/functions/generate/prompts.ts` (`agencyContent(c: Ctx): string`), `generate/index.ts` (kind
  `agency_content`, coste 3, effort `medium`, `maxTokens` 20000, guardado con `_meta` + `offer_at`)
- Modificar: `supabase/functions/generate/prompts.test.ts`, `scripts/mock-anthropic.mjs`, `scripts/mock-samples.mjs` (`CONTENT`), `scripts/e2e.mjs`
- Modificar: `src/lib/types.ts` (`AgencyContent`), `src/lib/tree.ts` (etiquetas)
- Crear: `src/components/sections/S12Content.tsx` (mismo patrón que `S5Offer.tsx`: `Deliverable` + árbol + copiar/descargar)
- Modificar: `src/lib/gamification.ts` (paso `id: 12`, "Tu contenido", después del 6), `src/pages/RoadmapPage.tsx` (`VIEWS`),
  `src/hooks/useData.ts` (el listado trae `agency_content`), `progressOf`/`isSectionDone` (`has_content`)

**Interfaces:**
- Produce el JSON (en `types.ts`):
```ts
export interface AgencyContent {
  reels: Array<{ titulo: string; gancho: string; desarrollo: string; cierre: string; texto_pantalla: string[]; caption: string; palabra_clave: string }> // 5
  bio: string
  carruseles: Array<{ titulo: string; diapositivas: string[]; caption: string }> // 3, 6-8 diapositivas
  _meta?: DeliverableMeta
}
```
- Produce: kind `agency_content`. Exige `ideal_client` y `agency_offer.oferta` hechos; si faltan → HTTP 409 `missing_offer`
  **antes de cobrar**.

- [ ] **Paso 1: Pruebas que fallan:**
  - `prompts.test.ts`: `agencyContent(ctx)` contiene `Comenta`, `wa.me` o "enlace de WhatsApp", la referencia al gancho de 3
    segundos y `"reels"`; con un ctx en euros no contiene `$` ni `EE. UU.`.
  - `e2e.mjs`: (a) `agency_content` en un proyecto sin oferta → status 409, `missing_offer`, y los créditos no cambian;
    (b) con oferta → 200, `reels.length === 5`, `carruseles.length === 3` y se descuentan exactamente 3 créditos;
    (c) el simulador registra que el prompt llevó `CLIENTE IDEAL YA DEFINIDO` y `OFERTA YA DEFINIDA`.
- [ ] **Paso 2:** `deno test supabase/functions/` y `node scripts/e2e.mjs` → FALLAN las nuevas.
- [ ] **Paso 3:** implementar. El prompt usa la sección 7.1 del diseño (ganchos, cierre "Comenta [PALABRA]" + WhatsApp,
  40-60 s) y le habla al dueño del nicho, no a quien quiere montar una agencia. Pantalla `S12Content` y paso 12 en el mapa.
- [ ] **Paso 4:** `deno test`, `pnpm test`, `pnpm build` y `node scripts/e2e.mjs` → todo en verde.
- [ ] **Paso 5:** commit `feat: paso de contenido (5 reels, bio y 3 carruseles)`.

### Tarea 6: Desplegar la rama

- [ ] **Paso 1:** `supabase config diff` no hace falta (no se toca la autenticación). Aplicar la migración en producción:
  `supabase db push --project-ref sniinyzcwdfgvnctshuj` (añade 2 columnas con valor por defecto; no toca datos).
- [ ] **Paso 2:** `ALLOWED_ORIGIN=https://creatuagencia-maestria.vercel.app,https://creatuagencia-maestria-git-agencia-real-info-79696548s-projects.vercel.app`
  y desplegar las 5 funciones de la tarea 1. Comprobar con `curl -X OPTIONS` que las dos URL reciben su propio
  `Access-Control-Allow-Origin`.
- [ ] **Paso 3:** push de la rama → preview de Vercel *Ready*. Comprobar que **producción sigue igual**: `curl` a
  `creatuagencia-maestria.vercel.app/login` → 200, y en el navegador un proyecto antiguo sigue enseñando su landing.

### Tarea 7: Pasada de punta a punta con datos reales

- [ ] **Paso 1:** con la cuenta de prueba (la crea Jose, o Claude con su permiso; **no** puede estar en `LIVE_DEMO_EMAILS`),
  en la preview: proyecto nuevo → problemas → nicho → precios → cliente ideal → oferta → landing → contenido, todo con Claude real.
- [ ] **Paso 2:** comprobar y apuntar las cifras: tiempo de cada generación (en `generations`, de `created_at` a
  `finished_at`; el contenido tiene que quedar por debajo de 140 s), créditos gastados (2+3+3+3 = 11), 0 errores en consola,
  la landing premium se ve, se descarga y su formulario abre WhatsApp.
- [ ] **Paso 3:** **PARAR.** Enseñar a Jose la landing, el contenido y las cifras, y las decisiones de la tarea 2 marcadas
  para revisión. No se sigue con la fase 2 hasta que Jose lo apruebe.

---

## FASE 2 — Anuncios

### Tarea 8: Anuncios de Meta

**Archivos:** los mismos que la tarea 5, con `agencyAds`, kind `agency_ads` (coste 3), `AgencyAds`, `S13Ads.tsx`, paso
`id: 13` "Tus anuncios" después del 12, `has_ads` y `ADS` en `mock-samples.mjs`. La columna ya existe (tarea 5).

**Interfaces:**
```ts
export interface AgencyAds {
  anuncios: Array<{ angulo: string; texto_principal: string; titular: string; descripcion: string; boton: string }> // 3
  videos: Array<{ titulo: string; gancho: string; guion: string; cierre: string }> // 2
  publico: { ubicacion: string; edad: string; intereses: string[]; comportamientos: string[]; notas: string }
  _meta?: DeliverableMeta
}
```

- [ ] **Paso 1: Pruebas que fallan:** `prompts.test.ts`: `agencyAds(ctx)` contiene los 7 bloques de la estructura del diseño
  (7.2: nicho + identidad, enemigo, "esto es para ti", "Estamos ayudando", "Qué te damos", "Olvídate de", escasez) y, en euros,
  no contiene `$` ni `hispanos en EE. UU.`. `e2e.mjs`: sin oferta → 409 sin cobrar; con oferta → 200, 3 anuncios, 2 vídeos,
  −3 créditos.
- [ ] **Paso 2:** comprobar que fallan.
- [ ] **Paso 3:** implementar. El enemigo sale de `perfil.como_capta_hoy`, "Olvídate de" de `dolores`, "Qué te damos" de
  `oferta.incluye` y la escasez de `oferta.urgencia`.
- [ ] **Paso 4:** todo en verde (`deno test`, `pnpm test`, `pnpm build`, `e2e`). Desplegar `generate` y probar en la
  preview con la cuenta de prueba (Claude real): tiempo, −3 créditos y se ve bien.
- [ ] **Paso 5:** commit `feat: paso de anuncios de Meta`. Enseñar a Jose.

---

## FASE 3 — Modo directo

### Tarea 9: Contenido preparado para el webinar

**Archivos:** `supabase/functions/generate/liveDemo.ts`.

- [ ] **Paso 1:** generar con Claude real (cuenta de prueba, proyecto "MaestrIA Agency" con los mismos datos del
  `ideal_client` y la `agency_offer` de `liveDemo.ts`) la landing premium, el contenido y los anuncios.
- [ ] **Paso 2:** Jose los revisa y los aprueba (diseño, decisión 5).
- [ ] **Paso 3:** pegar lo aprobado en `LIVE_CONTENT` como `agency_site_premium` (con `plantilla: 'premium'`, sin `html`),
  `agency_content` y `agency_ads`. El `agency_site` de hoy (con el `html` de Jose) **se queda** y se sigue usando cuando la
  petición no trae `plantilla: 'premium'` (la web de producción hasta la tarea 10). Prueba en `e2e.mjs` con una cuenta de
  `LIVE_DEMO_EMAILS`: `agency_site` con parámetro → premium; sin parámetro → con `html`; `agency_content` y `agency_ads` →
  `model = 'modo-directo'` y estructura válida.
- [ ] **Paso 4:** desplegar `generate` y probar con la cuenta del webinar en la preview. Commit `feat: modo directo con landing premium, contenido y anuncios`.

---

## FASE 4 — Cierre

### Tarea 10: Documentación y paso a producción

- [ ] **Paso 1:** README: pasos 12 y 13, créditos (camino completo = 15) y `ALLOWED_ORIGIN` con lista.
- [ ] **Paso 2:** revisión completa de la rama (diff contra `main`) y `pnpm build`, `pnpm test`, `deno test` y `e2e` en verde.
- [ ] **Paso 3:** con el OK de Jose, merge a `main` → despliegue en Vercel. Comprobar en producción: un proyecto antiguo
  se ve igual, uno nuevo genera los 5 entregables y la cuenta del webinar funciona.
- [ ] **Paso 4:** quitar la URL de la preview de `ALLOWED_ORIGIN` y comprobarlo con `curl`.
- [ ] **Paso 5:** el prompt viejo `agencySite` y el camino sin parámetro **se quedan**: los alumnos con la web vieja en
  caché pueden seguir pidiéndolo durante un tiempo. Se apunta como pendiente quitarlo más adelante.

## Pendientes fuera de este plan (apuntados, no se hacen sin permiso)
- `Legal.tsx:40` dice Render (ahora Vercel).
- Modelo del agente `claude-haiku-4-5-20251001` (antiguo).
- Archivo JS de la web > 500 kB (aviso de Vite).
- Pasar a claves nuevas de Supabase (`sb_secret_…`).
- Plan de Supabase: verificar si es Free (límite de 150 s).
