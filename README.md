# MaestrIA · Constructor de Agencia IA

Plataforma para que los alumnos monten su agencia de IA con ayuda de IA real (Claude). El **Mapa de Ruta** tiene 10 pasos y entrega
tres cosas para vender (cliente ideal, oferta, landing) más una secretaria virtual de WhatsApp para enseñar a los clientes:

1. Problemas que resuelves · 2. Tu agencia y tu nicho · 3. Tu cliente en números (leads, conversión, ticket, modo de precios)
4. **Cliente ideal** · 5. **Oferta** (usa el cliente ideal) · 6. **Landing** de venta premium (usa los dos anteriores)
7. **Tu agente**: ficha de un negocio típico del nicho + una secretaria que atiende, cualifica y agenda · 8. **Probar el agente**: simulador de WhatsApp para hablar con ella · 9. **Demo para clientes**: pega la web de un negocio (o escribe sus datos) y sale su propia secretaria · 10. **Conectar WhatsApp** (beta): vincula un número por QR y el agente contesta de verdad

## Cómo está organizado

- `src/lib/gamification.ts` define los pasos del mapa (nombre, icono, cabecera) y cuándo está hecho cada uno; `RoadmapPage.tsx` enlaza cada paso con su pantalla y no compila si falta alguna.
- `supabase/functions/_shared/` se comparte entre la Edge Function y el navegador (alias `@shared`): el catálogo de problemas y la **huella** de las respuestas.
- Cada entregable guarda en `_meta` la huella de las respuestas con las que se generó. Si el alumno las cambia después, la interfaz avisa de que está **desactualizado**.
- El alumno solo puede escribir sus respuestas (permisos por columna en `roadmaps`); lo que genera la IA lo escribe solo el servidor.
- Una generación en curso por proyecto y tipo (índice único): un segundo clic no cobra dos veces. Si la función muere a medias, la siguiente generación libera la colgada y devuelve sus créditos.

## Arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind + React Query (`src/`) |
| Auth y datos | Supabase: Auth (solo invitación), Postgres con seguridad por filas (`supabase/migrations/`) |
| IA | Edge Function `generate` (`supabase/functions/generate/`) → API de Anthropic. **La clave nunca llega al navegador** |
| Hosting | Render (web estática, `render.yaml`) + Supabase (base de datos, login y función de IA) |

**Cómo funciona la IA:** el navegador solo manda `{tipo, proyecto, parámetros}`. La función comprueba la sesión, lee el proyecto del alumno
(con su seguridad por filas), construye el prompt en el servidor (`prompts.ts`), cobra créditos de forma atómica, llama a Claude, guarda el
resultado en el proyecto y, si algo falla, **devuelve los créditos**.

### Créditos (coste por generación) — `supabase/functions/generate/index.ts` → `KINDS`

| Créditos | Generaciones |
|---|---|
| 1 | problema personalizado, sugerir nichos |
| 2 | cliente ideal |
| 3 | oferta, landing |
| 1 | agente (ficha del negocio de ejemplo), demo para un cliente |

El chat con el agente (paso 8) no cuesta créditos: usa un modelo pequeño (`AGENT_MODEL`, Haiku por defecto) y está limitado por ritmo
(`AGENT_CHAT_PER_MINUTE`, `AGENT_CHAT_PER_HOUR`) y por tamaño de conversación (40 mensajes).

Cada alumno recibe **30 créditos** al darse de alta (`app_settings.initial_credits`): el mapa completo cuesta unos 10, así que
da para regenerar cada entregable varias veces. Se ajustan con `scripts/invite.mjs`.

### Agentes: cómo funcionan
- La ficha del negocio (servicios, precios, horario, políticas, preguntas frecuentes, nombre y tono de la secretaria) se genera con `generate` (tipo `agent`) y se guarda en la tabla `agents`.
- Las **instrucciones del chat** no se guardan: `supabase/functions/_shared/agent.ts` las construye a partir de la ficha (la Edge Function `agent-chat` las usa para responder y el navegador las muestra para copiarlas).
- La **demo desde una URL** (`demo_agent`) descarga la web en el servidor (`generate/fetchSite.ts`) y la IA extrae la ficha usando solo lo que consta. Defensas contra SSRF: solo http/https en 80/443, sin usuario en la URL, se resuelve el DNS y se rechazan IP privadas, de bucle local, de enlace local y de metadatos de la nube, las redirecciones (máx. 3) se validan una a una, y hay límite de tiempo (20 s), de tamaño (1,5 MB) y solo HTML. Si la descarga falla no se cobra. Las fichas se limpian y se acotan antes de guardarse (el texto de una web ajena acaba dentro de las instrucciones del chat). Máximo 10 demos por proyecto. `FETCH_ALLOW_HOSTS` es solo para pruebas locales: en producción, vacío.
- `agent-chat` es sin estado: el navegador envía la conversación y recibe la siguiente respuesta. Las conversaciones no se guardan.

### WhatsApp real (beta): servidor WAHA
Vincular un número por QR necesita un servidor siempre encendido que mantenga la sesión de WhatsApp Web: **WAHA** (imagen `devlikeapro/waha:noweb`, sin navegador, ligera). Es una vía **no oficial** de Meta: puede acabar en el bloqueo del número. Por eso el agente solo responde (nunca inicia conversaciones), tiene topes por día y por chat, y se calla si el dueño contesta desde su móvil.

1. **Servidor (Render)**: *New → Web Service → Existing Image* → `docker.io/devlikeapro/waha:noweb`, plan de pago (necesita disco) y un **Disk** montado en `/app/.sessions` (1 GB). Variables: `WAHA_API_KEY` (clave larga aleatoria), `WHATSAPP_DEFAULT_ENGINE=NOWEB`, `PORT=3000`, `WAHA_DASHBOARD_ENABLED=false`, `WHATSAPP_SWAGGER_ENABLED=false`. Empieza con el plan más pequeño y vigila la memoria: si se reinicia por falta de RAM, sube de plan.
2. **Secretos en Supabase** (*Edge Functions → Secrets*): `WAHA_URL` (la URL del servicio de Render), `WAHA_API_KEY` (la misma), `WA_WEBHOOK_URL` (`https://TU-PROYECTO.supabase.co/functions/v1/wa-webhook`) y `WA_WEBHOOK_SECRET` (otro secreto largo; WAHA firma con él cada aviso y `wa-webhook` lo comprueba).
3. **Despliegue**: `supabase db push && supabase functions deploy wa-connect && supabase functions deploy wa-webhook` (la configuración `verify_jwt = false` de `wa-webhook` está en `supabase/config.toml`).
4. **Probar en local con un móvil real**: `docker run -d -p 3200:3000 -e WAHA_API_KEY=local -e WHATSAPP_DEFAULT_ENGINE=NOWEB devlikeapro/waha:noweb` (en un Mac con chip Apple: `devlikeapro/waha:noweb-arm`) y en `supabase/.env.local` pon `WAHA_URL=http://host.docker.internal:3200` y `WAHA_API_KEY=local`. `pnpm mock` + `node scripts/mock-waha.mjs` son los simuladores que usa `scripts/e2e.mjs`.

Privacidad: `wa_messages` guarda conversaciones reales de clientes de los alumnos; se borran a los 30 días y al desvincular el número, y solo las ve el alumno dueño. Hace falta un aviso de privacidad antes de abrirlo a alumnos.

## Desarrollo local

Requisitos: Node 20+, pnpm, Docker.

```bash
pnpm install
pnpm db:start                     # Supabase local (imprime URL y claves)
cp .env.example .env.local        # pega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
cp supabase/.env.example supabase/.env.local   # pon tu ANTHROPIC_API_KEY real
pnpm fn:serve                     # sirve la función de IA
pnpm dev                          # http://localhost:5173
```

> Los puertos de Supabase local en este repo son 554xx (para no chocar con otros proyectos). Ver `supabase/config.toml`.

Crear un alumno de prueba con contraseña (solo local):
```bash
SUPABASE_URL=http://127.0.0.1:55421 SUPABASE_SERVICE_ROLE_KEY=<clave secreta local> \
  node scripts/invite.mjs create alumno@test.com "Contraseña-Larga-1" --credits 30
```

### Pruebas
`pnpm mock` levanta una API de Anthropic **simulada** (y en `supabase/.env.local` de ejemplo se apunta a ella con
`ANTHROPIC_BASE_URL=http://host.docker.internal:8787`). Con ella:
```bash
SUPABASE_URL=… SUPABASE_ANON_KEY=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/e2e.mjs
```
Ejecuta unas 145 comprobaciones: créditos, seguridad entre alumnos, validaciones, reembolso si la IA falla, límite de ritmo, registro bloqueado, doble clic, respuestas de la IA con forma errónea, generaciones colgadas…
Para usar Claude de verdad, quita `ANTHROPIC_BASE_URL` de `supabase/.env.local`.

## Puesta en producción

1. **Supabase**: crea un proyecto en supabase.com → `supabase link --project-ref <ref>` → `supabase db push`.
   En *Authentication → URL configuration*: Site URL = tu dominio y añade `https://tu-dominio/reset-password` a Redirect URLs.
   En *Authentication → Providers → Email*: deja activo el email y **desactiva "Allow new users to sign up"** (acceso solo por invitación).
   Configura un SMTP propio (Resend, Postmark…) para que lleguen las invitaciones.
2. **Clave de IA**: en el panel de Supabase (*Edge Functions → Secrets*) crea `ANTHROPIC_API_KEY` y `ALLOWED_ORIGIN=https://tu-dominio` (mejor desde el panel que desde la terminal: la clave no queda en el historial). Después despliega: `supabase functions deploy generate && supabase functions deploy agent-chat (y, si usas WhatsApp real, `wa-connect` y `wa-webhook`)`.
   La función responde con un latido mientras Claude trabaja y se corta a los `GENERATION_TIMEOUT_SECONDS` (140 por defecto; el límite de la función es 150 s en Free y 400 s en Pro). Si la IA tarda más, el alumno ve un error y se le devuelven los créditos.
3. **Web (Render)**: *New → Blueprint* y elige este repo: Render lee `render.yaml` (sitio estático, reglas de reescritura de la SPA y cabeceras). Al crearlo te pide
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Settings → API del proyecto Supabase; la clave anónima es pública por diseño). Cada `git push` a `main` redespliega.
   Con la URL de Render ya puedes cerrar el paso 1 (Site URL y Redirect URLs) y el paso 2 (`ALLOWED_ORIGIN`).
4. **Alumnos**: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/invite.mjs csv alumnos.csv` (columnas `email,nombre,creditos`).
   `SITE_URL=https://tu-dominio` es obligatorio (a ese dominio llegan desde el email). Recibirán un email para crear su contraseña. Más créditos: `node scripts/invite.mjs grant ana@correo.com 20 "bonus"`.

**Seguridad:** `SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY` son secretos: no van en el frontend, en Render ni en git.
Antes de abrir a alumnos, fija un límite de gasto mensual en la consola de Anthropic.
