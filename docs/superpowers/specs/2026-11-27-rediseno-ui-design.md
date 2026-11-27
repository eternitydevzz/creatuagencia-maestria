# Rediseño visual de la app (opción B: un panel por paso)

Fecha: 2026-11-27 · Decide: Jose · Estado: pendiente de aprobación

## 1. Por qué
Hoy cada paso del Mapa de Ruta se lee como una lista: cabecera → estado → aviso → bloques, uno debajo de otro.
"Tu oferta" mide unos 2.000 px de alto. Cajas dentro de cajas con el mismo peso, párrafos largos y una columna fija
de 13 pasos que ocupa un tercio de la pantalla. Jose quiere que sea **elegante, visual y bien repartida**, con la mejor
experiencia posible, y poder **probarlo y volver atrás** si no le gusta.

## 2. Objetivos, no objetivos y lo que lo haría un fracaso
- **Objetivos:** que cada paso se entienda de un vistazo (lo importante grande, el detalle a un clic); menos scroll;
  más ancho útil; jerarquía clara; misma calidad en móvil.
- **No objetivos:** cambiar la marca (colores azules, logo, tipografía actual), cambiar los datos, los prompts, los
  créditos o el servidor. Modo claro. Pantallas públicas (login, demo pública, landing del alumno).
- **Fracaso aunque funcione:** que se pierda información que hoy se ve; que haya que hacer más clics para lo de
  siempre (copiar, regenerar, siguiente paso); que se vea peor en móvil; que algo deje de funcionar.

## 3. Enfoques considerados
- A. Pulido (espaciado y tipografía): rápido, pero se queda la sensación de lista.
- **B. Un panel por paso (elegido por Jose):** barra de fases arriba + cada entregable como panel con resumen
  grande, tarjetas en cuadrícula y pestañas para el detalle.
- C. Rediseño total con identidad nueva: más lento y arriesgado, y cambia la marca.

## 4. El diseño

### 4.1 Estructura de la pantalla del Mapa de Ruta
- **Barra de fases arriba**, en lugar de la columna lateral fija: los 13 pasos agrupados en 4 fases.
  - Estrategia: Problemas · Soluciones · Nicho · Precios
  - Tu oferta: Cliente ideal · Oferta
  - Captación: Landing · Contenido · Anuncios
  - Agente: Tu agente · Probar · Demos · WhatsApp
  - Se ve la fase actual con sus pasos (hechos, actual, pendientes) y las otras fases como pestañas con su avance
    ("3/4"). En móvil, una fila deslizable.
- **Cabecera del paso compacta** (una línea: icono, "Paso 6 · Tu oferta", estado y botones Copiar / Regenerar) en
  vez de dos tarjetas grandes (cabecera + "Listo").
- **El aviso de "has cambiado tus respuestas"** pasa a una etiqueta pequeña junto al estado, con el detalle al pasar
  el ratón o tocar.
- El contenido usa **todo el ancho**.

### 4.2 Cada entregable como panel
Patrón común: **resumen arriba (lo que importa, grande) → tarjetas en cuadrícula → detalle en pestañas.**
- **Tu oferta:** franja principal con la promesa y el precio como protagonista; la garantía resumida en una línea
  (el texto completo al desplegar); los 3 niveles (entrada, principal, premium) como tarjetas comparables; pitch
  en una tarjeta destacada; "oferta completa" en pestañas (Qué incluye · Objeciones · Piloto · Números).
- **Cliente ideal:** ficha de persona (avatar, nombre, negocio) + 3-4 cifras clave como tarjetas + sus frases en
  burbujas + pestañas para el resto (Perfil · Dolores · Dónde encontrarlo · Cómo cualificarlo).
- **Contenido:** los reels como tarjetas compactas en cuadrícula (formato, gancho, palabra clave) que se abren al
  pulsar; pestañas Reels · Bio · Carruseles.
- **Anuncios:** los 3 anuncios como "vista previa de anuncio" lado a lado; público en tarjetas con etiquetas.
- Resto de pasos (problemas, nicho, precios, landing, agente, demos, WhatsApp): mismo lenguaje visual (cuadrículas,
  tarjetas con un solo nivel, cifras destacadas), sin cambiar lo que hacen.

### 4.3 Reglas visuales para todas las pantallas
- Un solo nivel de tarjeta (nada de tarjeta dentro de tarjeta), con más aire entre bloques.
- Jerarquía por tamaño: una cifra o frase protagonista por bloque.
- Textos largos → puntos, etiquetas o "ver más".
- Mismos colores, logo y letras de hoy.
- Arreglar el solape de "Alumnos" con el contador de créditos en la barra superior.

### 4.4 Punto de control (para volver atrás)
- Antes de empezar: etiqueta de git `antes-del-rediseno` en `main` (00aa290).
- Todo en la rama `rediseno-ui`; Jose prueba en la preview de Vercel. Nada llega a producción sin su OK.
- Si no le gusta: se descarta la rama. Si ya estuviera en producción: Instant Rollback de Vercel o volver a la etiqueta.
- Se construye por partes: **primera entrega = barra de fases + cabecera compacta + "Tu oferta"**. Jose la prueba.
  Solo con su OK se sigue con el resto, pantalla a pantalla.

## 5. Límites y riesgos
- La preview de Vercel pide la sesión de Vercel; Jose la tiene (Owner). Para **ver** las pantallas basta con leer la
  base de datos, que no depende de `ALLOWED_ORIGIN` (eso solo afecta a las funciones de IA): no se toca ningún
  secreto. Generar o regenerar desde la preview no funcionará; para eso se prueba en producción tras el OK.
- Claude revisa cada pantalla en local (Vite contra la base de datos de producción, con la cuenta de prueba
  prueba-agencia-real, que tiene los 13 pasos con datos), con capturas en escritorio (1440 px) y móvil (390 px).
- Las pruebas de hoy (Vitest, e2e) no miran el aspecto: cada pantalla se revisa con capturas en escritorio y móvil.
- Riesgo de "perder" información al resumir: cada panel conserva todo lo que hoy se ve (resumen + pestañas).

## 6. Lo que decide quien construye
- Iconos, tamaños exactos, animaciones suaves y el orden interno de las tarjetas, dentro de estas reglas.
- Nombres de los componentes nuevos (por ejemplo `PhaseBar`, `StepHeader`, `Panel`, `Tabs`).

### Decisiones de Claude (revisables por Jose)
1. Las 4 fases y su agrupación (4.1).
2. Las pestañas dentro de cada entregable en lugar de "ver la ficha completa" desplegable.
3. La primera entrega es "Tu oferta" porque es la pantalla más larga y la que más se parece a una lista.
