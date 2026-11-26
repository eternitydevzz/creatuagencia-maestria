# Diseño: MaestrIA para crear una agencia de verdad

Fecha: 2026-11-25 · Autores: Jose y Claude · Estado: borrador para aprobar

## 1. Qué queremos y por qué

Hoy la app sirve sobre todo para el webinar. Queremos que un alumno real, con su cuenta, salga con su agencia montada
usando Claude con sus propios datos:

1. Su cliente ideal
2. Su oferta
3. Su página de agencia (landing)
4. Sus primeros guiones y su primer contenido
5. Sus primeros anuncios

Y que todo quede al nivel de lo que se enseña en el webinar.

## 2. Objetivos, no objetivos y lo que sería un fracaso

**Objetivos**
- Los 5 entregables salen de Claude con los datos del alumno, encadenados: cliente ideal → oferta → landing → contenido → anuncios.
- La landing del alumno tiene la misma calidad visual que la landing hecha a mano por Jose (`eternity-agency/index.html`).
- El contenido y los anuncios sirven para que **el alumno consiga sus primeros clientes empresarios** (decisión de Jose: opción A).
- El modo directo (webinar) sigue funcionando y cubre también los pasos nuevos.

**No objetivos (por ahora)**
- Anuncios o contenido para los clientes del alumno (opción B, descartada).
- Imágenes generadas para los anuncios: Claude solo genera texto.
- Publicar en Instagram o en Meta Ads desde la app. El alumno copia y publica.
- Variantes de estructura de la landing (camino C). Solo si después de A hace falta.

**Sería un fracaso aunque funcione si...**
- La landing del alumno se nota claramente peor que la del webinar.
- El contenido es genérico y serviría igual para cualquier nicho.
- Una generación tarda tanto que se corta (límite de 140 s) o sale rota.
- Un cambio rompe a los alumnos que ya tienen proyectos guardados.

## 3. Cómo está hoy (comprobado en el código)

- **Motor de IA**: Edge Function `generate` (`supabase/functions/generate/index.ts`). Tipos con coste en créditos:
  `ideal_client` 2, `agency_offer` 3, `agency_site` 3, `agent` 1, `demo_agent` 1, `custom_problem` 1, `new_niches` 1.
  Modelo principal `claude-sonnet-5-5`; agentes con `claude-haiku-4-5-20251001`. Valida el JSON, reintenta 1 vez y
  devuelve los créditos si falla. Límite de 140 s por generación.
- **Modo directo**: si el email está en el secreto `LIVE_DEMO_EMAILS`, no se llama a Claude. Espera 7-10 s y devuelve
  `LIVE_CONTENT` de `generate/liveDemo.ts` ("MaestrIA Agency", clínicas dentales de Miami). Cubre `ideal_client`,
  `agency_offer`, `agency_site`, `agent` y `demo_agent`. Su landing trae `html`: la página de Jose (173.564 caracteres).
- **Landing del alumno real**: plantilla `src/lib/agencySite.ts`, 5 direcciones visuales y **sin JavaScript**. La vista
  previa (`S6Landing.tsx`) usa un iframe con `sandbox` sin `allow-scripts`, salvo cuando hay `html` propio.
- **Pasos de la app** (`src/lib/gamification.ts`): Problemas → Soluciones → Nicho → Precios → Cliente ideal → Oferta →
  Landing → Agente → Probar agente → Demos → WhatsApp.
- **Datos**: tabla `roadmaps` con columnas jsonb `ideal_client`, `agency_offer`, `agency_site`, y `agency_contact`
  (`whatsapp`, `email`). No existe nada para contenido ni anuncios.
- **Despliegue**: web en Vercel (push a `main` = producción; otras ramas = preview). Supabase de producción
  `sniinyzcwdfgvnctshuj`, sin entorno de pruebas aparte. `ALLOWED_ORIGIN` admite **un solo** dominio.

## 4. La landing de Jose (medida)

`eternity-agency/index.html`: 170.782 bytes, un solo archivo, sin scripts, fuentes ni imágenes externas.
CSS 119.871 caracteres (70 %) · JS 21.612 (13 %) · SVG 5.178 (3 %) · texto y estructura 23.912 (14 %).
Secciones: hero, manifiesto, demo en vivo, servicios, proceso, resultados, FAQ, contacto.
El JS hace la pantalla de carga, las partículas del hero (canvas) y las animaciones al hacer scroll. No llama a internet.
Todo el texto está escrito para "Eternity" y clínicas dentales de Miami, incluida la conversación de la demo.

## 5. Formas de hacer la landing (elegida: A)

| | Qué es | A favor | En contra |
|---|---|---|---|
| **A (elegida)** | La página de Jose como plantilla: diseño, JS y demo intactos; Claude rellena los huecos de texto | Calidad de Jose garantizada para todos, igual de rápida y barata que hoy, no puede salir rota | Todas comparten estructura (cambian textos y color de acento) |
| B (descartada) | Claude escribe el HTML entero de cada alumno | Cada página única | Estimación: ~46.000 tokens de salida por página (170.782 caracteres ÷ ~3,7). Incluso a 100 tokens/s serían ~8 min, muy por encima de los 140 s. Calidad irregular y páginas rotas |
| C (más adelante) | A + 2-3 estructuras hechas con las mismas piezas | Más variedad entre nichos | Más trabajo. Solo si tras A hace falta |

## 6. Diseño

### 6.1 Landing con la plantilla de Jose
- Nuevo renderizador basado en `eternity-agency/index.html`: el CSS y el JS se copian tal cual y el texto de cada
  sección pasa a ser un hueco que se rellena desde `agency_site`. Todo el texto se escapa antes de insertarlo.
- Huecos nuevos que hoy no existen en `agency_site`: manifiesto y **conversación de la demo** (mensajes del cliente y del
  agente, con hora). La conversación sale del agente y del cliente ideal del alumno.
- El color de acento se puede ajustar por nicho. El resto del diseño no se toca.
- La vista previa necesita `allow-scripts` (sin `allow-same-origin`, como hoy con el `html` propio).
- Compatibilidad: los proyectos guardados con el formato actual tienen que seguir viéndose. Se decide al construir si se
  pintan con la plantilla nueva (rellenando lo que falte) o con la antigua.
- Modo directo: su landing deja de ser el `html` fijo y sale de la plantilla con el contenido preparado.

### 6.2 Contenido (paso nuevo, 3 créditos)
Sale del cliente ideal, la oferta y la landing del alumno. Público: dueños del nicho del alumno.
- **5 guiones de reel** (30-60 s): gancho de los 3 primeros segundos, desarrollo, cierre, texto en pantalla y caption.
- **Bio de Instagram.**
- **3 carruseles**: texto de cada diapositiva y caption.
- **Cierre**: "Comenta [PALABRA] y te mando..." y, como alternativa, su enlace de WhatsApp, porque un alumno que empieza
  no suele tener ManyChat (es una suposición nuestra, sin verificar).

### 6.3 Anuncios (paso nuevo, 3 créditos)
- **3 anuncios de Meta** (texto principal, titular y botón) con la estructura de la sección 7.2.
- **2 guiones de vídeo-anuncio.**
- **Público al que apuntar** (segmentación sugerida).
- Sin imagen generada.

### 6.4 Créditos
Contenido 3 y anuncios 3. El camino completo pasa de 9 a 15 créditos. Un alumno nuevo sigue recibiendo 30.

### 6.5 Modo directo
Se mantiene. Se escribe contenido preparado para los pasos nuevos ("MaestrIA Agency", clínicas dentales de Miami),
coherente con el cliente ideal y la oferta que ya existen.

## 7. Investigación de referencia (ScrapeCreators, 2026-11-25)

Muestra: 50 reels de Instagram, 7 transcripciones y los anuncios activos de 4 búsquedas en la biblioteca de anuncios de Meta.
Son patrones, no una estadística. @cristianews.ai no se pudo leer: Instagram lo marca como "age restricted" (error 403).

### 7.1 Reels
- Ganchos que mejor funcionan en el nicho IA: novedad + regalo ("Es una brutalidad que alguien acaba de regalar una
  agencia de IA...", @mago_jp_oficial, 39.383 vistas, el más visto) y experto desde cero ("Si mañana abriera una
  agencia, así conseguiría los 10 primeros clientes...", @mailerfind; "Si tuviera que empezar hoy desde cero...",
  @andrea.eskailet).
- Cierre casi universal: "Comenta [PALABRA] y te mando..." (9 de los 10 reels con más vistas). Duración de 40 a 100 s.
- Ojo: la mayoría le habla a quien quiere montar una agencia, no a dueños de negocios. Para el alumno sirven los
  formatos y los ganchos, no el público.
- Dirigido a negocios: @charliesebastiania hace una escena dialogada con un "doctor", responde sus objeciones en
  directo ("¿cómo sé que cumplirás?" → "7 días gratis") y usa urgencia real ("congelamos el precio antes de los 1.000 doctores").

### 7.2 Anuncios: estructura de Systemic Digital
Es una agencia que vende a negocios hispanos en EE. UU. Repite la misma plantilla en 7 nichos (limpieza, flooring,
concreto, tree service, pintura, HVAC, contratistas), todos en formato vídeo:
1. Nicho + identidad: "Negocios de limpieza hispanos en EE.UU."
2. Enemigo concreto: "¿Cansado de pagar Angie's List o HomeAdvisor para que te manden leads compartidos...?"
3. "Si tienes un negocio de [subnichos], esto es para ti"
4. Prueba de que se mueve: "Estamos ayudando a [nicho] a conseguir clientes reales..."
5. "Qué te damos": 4 puntos con emoji del nicho
6. "Olvídate de": 3 puntos con ❌
7. Escasez geográfica: "revisa si tu ciudad todavía está disponible"

Cómo se rellena con los datos del alumno: enemigo ← `ideal_client.perfil.como_capta_hoy`; "olvídate de" ←
`ideal_client.dolores`; "qué te damos" ← `agency_offer.oferta.incluye`; escasez ← `agency_offer.oferta.urgencia`.

**Cambio de Jose (2026-11-26), sustituye a lo anterior tras ver la primera versión real:** los anuncios tienen que ser
mucho más cortos y al grano. Texto de **4 líneas** (dolor → problema → resultado → CTA "👇 Haz clic aquí abajo y
escríbenos por WhatsApp"), sin listas, y el clic va **directo a WhatsApp**. Los vídeos de anuncio y los reels duran
**30-40 s como mucho**, se hacen **faceless** (voz en off + rótulos, edición viral con IA) y siguen un storytelling básico:
**hook → problema → insight → solución → CTA**.

**Revisión 2 (2026-11-26):** la primera versión sonaba mecánica. Reels y vídeos se cuentan como **una historia en segunda
persona** (escena con hora y un cliente de ejemplo, tensión, giro y salida), en un `guion` seguido (una frase por línea) y sin
etiquetas; el arco anterior queda como guía, no como casillas. Como mucho una cifra por pieza y sin coletillas ("estimado").
Las personas de las escenas son ejemplos de situaciones típicas, nunca "un cliente mío". Los anuncios suenan a persona, no a informe.

**Revisión 3 (2026-11-26):** los 5 reels salían iguales (misma plantilla de escena). Ahora cada reel usa un **formato distinto**
de la investigación: Experto ("Si tuviera…"), Diálogo con objeción, Mito vs realidad, Lista rápida y Escena. Los **guiones de
vídeo de anuncio se quitan**: a Jose le gustan los 3 anuncios cortos también como guion hablado, así que valen para las dos cosas.

## 8. Límites y riesgos

- **Una sola base de datos (la de producción)**: las Edge Functions se despliegan directamente en producción. Cambiar el
  formato de `agency_site` puede romper a alumnos actuales si la web y la función no cambian a la vez. Los cambios en la
  función tienen que admitir el formato viejo y el nuevo.
- **`ALLOWED_ORIGIN` solo admite un dominio**: una preview de Vercel no puede llamar a las funciones. Para probar en una
  rama hay que admitir más de un dominio (por ejemplo, una lista separada por comas).
- **Tiempo**: el contenido (5 guiones + bio + 3 carruseles) puede ser largo. Si se acerca a los 140 s, se divide en dos
  generaciones.
- **Plan de Supabase**: suponemos que es el Free, porque existe el keepalive. No está verificado. El Free corta cada función a los 150 s.
- **Modelo del agente**: `claude-haiku-4-5-20251001` es antiguo. Fuera de este proyecto; se apunta como pendiente.

## 9. Forma de trabajar

- Fases en orden. Cada fase se prueba con datos reales antes de pasar a la siguiente.
- **Fase 1 = pasada de punta a punta con datos reales**: una cuenta de prueba (no de modo directo) genera su landing con la
  plantilla A y su primer guion, y se ve en la app desplegada. Hasta que Jose la vea, no se construye lo siguiente.
- Trabajo en una rama y no directamente en `main` (cada push a `main` despliega a producción).

## 10. Lo que queda para quien construya

- Nombres exactos de los huecos de la plantilla y del JSON nuevo de `agency_site`.
- Nombres de los tipos y de las columnas nuevas (por ejemplo `agency_content` y `agency_ads`) y su migración.
- Prompts de contenido y anuncios, usando la sección 7.
- Pantallas de los pasos nuevos, reutilizando el patrón de `S4IdealClient`/`S5Offer` (`Deliverable` + `lib/tree.ts`).

### Decisiones de Claude (revisables por Jose)
1. **La conversación de la demo sale del cliente ideal y la oferta, no del agente**, porque la landing (paso 7) va antes
   que el agente (paso 8) y el alumno puede no tener agente todavía. Claude escribe una conversación creíble con un
   cliente típico del nicho.
2. **Orden de los pasos nuevos**: Contenido y Anuncios van justo después de la Landing y antes del Agente, siguiendo el
   orden de la lista de Jose (cliente ideal → oferta → landing → contenido → anuncios).
3. **Marca**: en la plantilla, "Eternity" y su logo se cambian por el nombre de la agencia del alumno y un logo con sus
   iniciales, como ya hace la plantilla actual.
4. **Color de acento**: Claude lo elige de una lista cerrada de colores probados sobre el diseño de Jose. No se aceptan
   colores libres, para que nunca quede ilegible.
5. **Contenido del modo directo para los pasos nuevos**: lo escribe Claude y Jose lo aprueba en la revisión de esa fase.
6. **Idioma y mercado**: como ya hace la app, salen de la moneda del proyecto (euro = España, dólar = EE. UU. hispano).

## 11. Pendiente de Jose

- Cuenta de prueba para la fase 1: la crea Jose desde Alumnos, o me autoriza a crearla.
- Ejemplos propios de guiones y anuncios (opcionales): si llegan, se suman a la sección 7.
- Enlaces de reels de @cristianews.ai, si quiere que se estudie esa cuenta por enlace.
