# Rediseño visual (un panel por paso) — Plan de implementación

> **Para quien lo ejecute:** se trabaja en el chat principal, sin agentes (regla de Jose), tarea a tarea y en orden.
> Pasos con casillas (`- [ ]`). Puntos de control marcados con **PARAR**: no se sigue sin el OK de Jose.

**Estado (2026-11-27):** Fase 0 y Fase 1 hechas en `rediseno-ui` (commits 37ec6dc..55efb60, tag `antes-del-rediseno`
= 00aa290). Punto de control 1: Jose dice "sigue con el resto de pantallas". En curso: Fase 2 (tarea 9).
Ver en local: Vite con `VITE_SUPABASE_URL`/anon de producción por variable de entorno y la cuenta prueba-agencia-real.

**Objetivo:** que cada paso del Mapa de Ruta deje de leerse como una lista y se vea como un panel: barra de fases arriba,
cabecera compacta, lo importante grande y el detalle en pestañas.

**Arquitectura:** solo cambia el frontend (`src/`). Piezas nuevas reutilizables (`PhaseBar`, `Tabs`, cabecera y estado
compactos) y cada pantalla de paso se reescribe con ellas. Datos, prompts, créditos y funciones no se tocan.

**Tecnología:** React 18 + TypeScript + Vite + Tailwind + lucide-react. Vitest para la lógica pura. Capturas con Playwright.

**Diseño:** `docs/superpowers/specs/2026-11-27-rediseno-ui-design.md`

## Reglas globales
- Marca intacta: mismos colores (tokens de `tailwind.config` e `index.css`), logo y tipografía.
- Nada de tarjeta dentro de tarjeta. Una cifra o frase protagonista por bloque. Textos largos → puntos o "ver más".
- Toda la información que hoy se ve sigue estando (en el resumen o en una pestaña).
- Copiar, Regenerar y "Siguiente" siguen a un clic.
- Cada pantalla se revisa con capturas a **1440 px** y **390 px**, y 0 errores de consola.
- Trabajo en la rama `rediseno-ui`. **Nada se sube a `main` sin el OK de Jose.**

## Revisión: lo que las pruebas no cubren y hay que mirar a mano
1. Móvil (390 px): barra de fases deslizable, pestañas que no se salgan, botones a un dedo.
2. Teclado y lectores de pantalla: pestañas con flechas, `aria-selected`, foco visible.
3. Proyectos con datos a medias o en formato antiguo (la landing vieja, ofertas sin niveles): no deben romper.
4. Textos muy largos (nombres de oferta, garantías): sin desbordes.
5. Usuarios con la web abierta durante el cambio: nada guardado cambia de forma.

---

## FASE 0 — Punto de control

### Tarea 1: Etiqueta, rama y entorno para ver datos reales
- [ ] `git tag antes-del-rediseno 00aa290 && git push origin antes-del-rediseno` (la versión de hoy).
- [ ] `git checkout -b rediseno-ui` desde `main`; commit de este plan y del diseño.
- [ ] Vite en local contra la base de datos de producción (solo lectura en la práctica: no se genera nada),
  con `VITE_SUPABASE_URL` y la clave pública anon de producción por variable de entorno, sin guardarlas en archivos.
  Entrar con la cuenta de prueba `prueba-agencia-real-20261125@maestria-prep.test` (proyecto "Agencia Norte · Fisio").
- [ ] Capturas "antes" de Tu oferta a 1440 y 390 px. **Esperado:** se ven los datos reales.

## FASE 1 — Primera entrega (barra de fases, cabecera compacta y "Tu oferta")

### Tarea 2: Las fases (lógica)
**Archivos:** `src/lib/gamification.ts`, `src/lib/gamification.test.ts`
- Produce: `PHASES: ReadonlyArray<{ id: 'estrategia' | 'oferta' | 'captacion' | 'agente'; title: string; steps: SectionId[] }>`,
  `phaseOf(id: SectionId)`, `phaseProgress(p: Progress, phase) → { done: number; total: number }`.
- [ ] Tests primero (rojo): las 4 fases cubren los 13 pasos una sola vez y en el orden de `SECTIONS`;
  Estrategia = [1, 11, 2, 3], Tu oferta = [4, 5], Captación = [6, 12, 13], Agente = [7, 8, 9, 10];
  `phaseOf(12)` = captacion; `phaseProgress` cuenta los pasos hechos.
- [ ] Implementar → verde. Commit `feat: fases del mapa de ruta`.

### Tarea 3: Barra de fases en lugar de la columna lateral
**Archivos:** crear `src/components/PhaseBar.tsx`; modificar `src/pages/RoadmapPage.tsx`, `src/index.css`
- Arriba: 4 pestañas de fase con su avance ("3/4"); debajo, los pasos de la fase activa como "chips" (hecho,
  actual, pendiente). Clic en un paso = `go(id)` como hoy. En móvil, fila deslizable con el paso actual centrado.
- El contenido del paso ocupa todo el ancho (`max-w-6xl`). Se quita la columna `lg:w-64`.
- [ ] Capturas 1440/390. **Esperado:** sin columna lateral; se ve en qué fase y paso estás; se llega a cualquier paso
  en 1-2 clics. Commit `feat: barra de fases`.

### Tarea 4: Cabecera y estado compactos
**Archivos:** `src/components/ui/bits.tsx` (`SectionHeader`), `src/components/Deliverable.tsx`
- `SectionHeader` en una franja baja: icono pequeño, "Paso N de 13 · Título" y el subtítulo en una línea
  (el texto completo en `title` o en un "más").
- `Deliverable`: en vez de la tarjeta "Listo", una barra fina con el estado (punto verde "Listo" / "Sin generar"),
  las acciones y Regenerar a la derecha. El aviso `stale` pasa a una etiqueta ámbar ("Desactualizado") con el texto
  al pasar el ratón o tocar (`<details>` o `title` + `aria-describedby`).
- Afecta a todos los pasos con entregable; deben seguir funcionando igual.
- [ ] Capturas de Cliente ideal, Oferta y Landing a 1440/390. Commit `feat: cabecera y estado compactos`.

### Tarea 5: Pestañas reutilizables
**Archivos:** crear `src/components/ui/Tabs.tsx`
- `Tabs({ tabs: Array<{ id: string; label: string; content: ReactNode }>, initial?: string })`, accesible:
  `role="tablist"`/`tab`/`tabpanel`, `aria-selected`, flechas izquierda/derecha, foco visible. En móvil, se desliza.
- [ ] Probar con teclado en Playwright (Tab + flechas). Commit `feat: pestañas`.

### Tarea 6: "Tu oferta" como panel
**Archivos:** `src/components/sections/S5Offer.tsx` (y los helpers de `Deliverable.tsx` si hace falta)
- Franja principal: nombre de la oferta + promesa a la izquierda; precio protagonista a la derecha (valor tachado,
  puesta en marcha, mensual) y los bonos como etiquetas.
- Garantía en una línea con icono y "ver garantía completa".
- Los 3 niveles (escalera) como tarjetas comparables a la misma altura, la principal destacada.
- Pitch de 30 s en una tarjeta destacada con Copiar.
- `Tabs` con el resto: Qué incluye · Objeciones · Piloto · Números (las claves que hoy salen en "ver la oferta
  completa"); lo que no encaje en esas, en una pestaña "Más".
- Ofertas antiguas sin algún campo: ese bloque no se pinta (sin huecos vacíos).
- [ ] Capturas 1440/390 y comparación con las de "antes": **Esperado:** cabe mucho más en la primera pantalla y no
  falta nada. Commit `feat: la oferta como panel`.

### Tarea 7: Barra superior sin solapes
**Archivos:** `src/components/AppShell.tsx`
- La navegación no puede invadir el bloque de créditos/nivel: `min-w-0` y etiquetas que se ocultan antes (solo
  icono) cuando no caben; el admin ve "Alumnos" sin pisar nada.
- [ ] Capturas a 1440, 1280, 1024 y 390 px con la cuenta admin. Commit `fix: barra superior sin solapes`.

### Tarea 8: PUNTO DE CONTROL 1
- [ ] `pnpm test`, `tsc`, `build` en verde. Push de `rediseno-ui` → preview de Vercel.
- [ ] **PARAR.** Enseñar a Jose capturas antes/después y el enlace de la preview (lo abre con su sesión de Vercel;
  ver funciona, generar no). Preguntar: ¿sigo así con el resto, ajusto algo o volvemos atrás (se descarta la rama)?

## FASE 2 — El resto de pantallas (solo con el OK del punto 1)
Mismo patrón (resumen grande → tarjetas → pestañas), capturas 1440/390 y commit por tarea.

### Tarea 9: Cliente ideal
Ficha de persona (avatar, nombre, negocio) + 3-4 cifras clave + sus frases en burbujas + pestañas
(Perfil · Dolores · Dónde encontrarlo · Cómo cualificarlo · Más).

### Tarea 10: Contenido y anuncios
Contenido: pestañas Reels · Bio · Carruseles; reels como tarjetas compactas (formato, gancho, palabra clave) que se
abren al pulsar. Anuncios: los 3 como vista previa de anuncio lado a lado; público con etiquetas.

### Tarea 11: Landing, agente, probar, demos y WhatsApp
Mismo lenguaje visual sin cambiar lo que hacen (la vista previa de la landing a lo ancho; el agente como ficha).

### Tarea 12: Fase Estrategia (problemas, soluciones, nicho, precios)
Cuadrículas de opciones con un solo nivel de tarjeta; precios con las cifras protagonistas.

### Tarea 13: PUNTO DE CONTROL 2
- [ ] Suite en verde, push a la preview. **PARAR.** Jose revisa todas las pantallas.

## FASE 3 — Cierre

### Tarea 14: Dashboard, proyectos y ajustes
Mismo lenguaje visual (sin cambios de funcionamiento). Capturas 1440/390.

### Tarea 15: Paso a producción
- [ ] Revisión completa de la rama (diff contra `main`), suite en verde, revisar los 5 puntos de "Revisión".
- [ ] **Con el OK de Jose:** merge a `main`. Comprobar en producción con capturas.
- [ ] Recordar cómo volver atrás: Instant Rollback en Vercel o `git revert` hasta `antes-del-rediseno`.
