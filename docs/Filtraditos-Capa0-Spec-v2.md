# Filtraditos — Spec de Producto: Capa 0 (v2)
**El Ritual con Alma**

**Autor:** CASCARA · **Para:** agente de frontend / GUSTAVITO · **Versión:** 2.0
**Basado en:** Documento Fundacional v1 + Brief Capa 0 + sesión de diseño de pantallas
**Reemplaza:** Filtraditos-Capa0-Spec-v1.md

---

## 0. Qué es esta versión

La v1 de esta spec definió las 8 historias de uso. Esta v2 incorpora todas las decisiones de diseño de pantallas tomadas después: el arco de tres fases con la preparación física incluida, la pantalla única del ritual, el sistema de cajas fijas, la estética japonesa blanco y negro, y la separación entre lo que diseña Arao (Lotties, ilustraciones) y lo que implementa el agente.

**Documentos hermanos que hay que leer junto a este:**
- `Filtraditos-Sistema-Diseno-v1.md` — toda la dirección visual (paleta, tipografía, superficie, movimiento)
- `CLAUDE.md` (en el repo) — reglas de arquitectura y convenciones

---

## 1. La tesis

Filtraditos no es una app de *preparar* café. Es una app de *aprender a paladear*. El compañero de alguien que se está enamorando del café de especialidad.

BrewLab v1 funcionaba técnicamente pero no provocaba usarla — se sentía genérica. Capa 0 arregla eso: reconstruye la experiencia para que tenga alma, sin tocar el engine que ya funciona.

**Principio rector: la interfaz ES el producto.** Las animaciones Lottie no son decoración — son funcionalidad central. Una pantalla que funciona pero se siente tediosa **no cumple el criterio de aceptación.**

---

## 2. Los dos usuarios (misma persona, dos momentos)

- **El que juega / el principiante:** quiere el ritual y la emoción. Un tap después de colar y sigue con su vida.
- **El que estudia / el metódico:** quiere registrar, comparar, ajustar, entender su paladar.

Ninguna pantalla sacrifica a uno por el otro. La técnica es profundidad opcional escondida (ver Sistema de Diseño §6).

---

## 3. El arco completo — tres fases

```
FASE 1 · ANTESALA        Home → Carrusel de recetas → Checklist de preparación
FASE 2 · RITUAL          Una sola pantalla, cinco estados
FASE 3 · VEREDICTO       El café servido → emoción → diagnóstico/éxito
```

El ritual físico del café de especialidad (ajustar molino, moler, calentar, armar V60) es parte del producto, no una precondición fuera de scope.

---

## 4. Las pantallas

### FASE 1 — ANTESALA

#### P-01 · HOME
Puerta de entrada. Un solo botón, una promesa.

**Criterio de aceptación:**
- Una sola acción primaria visible ("Preparar un café") como protagonista.
- Lottie V60 idle activo (pantalla viva antes de tocar nada).
- Sin tabs, menús ni iconos de biblioteca visibles.
- Referencia discreta a la última sesión, subordinada visualmente.
- De abrir la app a poder tocar el botón: ≤ 1 interacción.

**Lottie (Arao):** `v60-idle` — V60 sobre servidor vacío, tetera en reposo, vapor sutil o brillo cíclico. Loop. ~260×260px.

#### P-02 · CARRUSEL DE RECETAS
Elegir qué preparar. Tarjetas 3D deslizables.

**Criterio de aceptación:**
- Carrusel coverflow: tarjeta central enfocada, laterales en perspectiva y escala reducida.
- Tabs superiores: **Recetas** (activo en Capa 0) / **Granos** (existe pero lleva a Capa 1).
- Cada tarjeta muestra: nombre de receta, tipo (clásica/personal), dosis, agua, tiempo.
- Rotación tocando las tarjetas laterales o swipe.
- **Flip 3D manual:** el usuario voltea la tarjeta central con el dedo (touchmove → rotateY + inercia) para leer el dorso con la historia/resumen de la receta. Solo la central se voltea.
- La línea/dot ámbar de acento solo aparece en la tarjeta central (seleccionada).
- CTA "Preparar con esta".
- Dose y clic del molino editables antes de empezar.

**Ilustración (Arao):** cara frontal y dorsal de cada receta (Hoffmann, Kasuya, Fácil + personalizadas). Tinta seca sobre washi.

**⚠️ DECISIÓN ABIERTA:** el diseño de las tarjetas (ilustración predominante vs. información clara) no está cerrado. Arao busca inspiración. Se resuelve viendo la primera versión funcional en la mano. El agente puede implementar con un layout de información clara como base editable.

#### P-03 · CHECKLIST DE PREPARACIÓN
Ritual físico antes del agua.

**Criterio de aceptación:**
- Lista de pasos con checkbox táctil, en el orden real del ritual: ajustar molino → moler café → calentar agua → armar V60 con filtro → enjuagar filtro → tarar báscula.
- Los valores vienen de la receta elegida ("Ajustá a Clic 4", "Molé 18g").
- El CTA de inicio solo se activa cuando todos los pasos están marcados.
- El checklist debe ser configurable por receta en el futuro; por ahora, secuencia fija para V60.

---

### FASE 2 — RITUAL

#### P-04 · RITUAL (pantalla única, cinco estados)
Todo el proceso de filtrado vive en una sola pantalla, igual que la realidad física. El usuario no navega entre verter y esperar — está frente al mismo V60 todo el tiempo.

**Sistema de cajas fijas.** Cinco zonas que nunca aparecen ni desaparecen; solo cambia su contenido según el estado. Como un reloj analógico donde solo giran los dígitos.

| Caja | Contenido | Comportamiento |
|---|---|---|
| **1 · Timer general** | Tiempo total de la receta + nombre + paso actual | Siempre visible, arriba, sutil. Big Shoulders mediano. |
| **2 · Status track** | Los pasos reales de la receta elegida | Marca el activo. Barra de progreso interna que se llena. |
| **3 · Lottie V60** | La animación del proceso | La caja es fija; la animación adentro cambia de estado. |
| **4 · Número gigante** | El dato protagonista | Fijo en posición. Big Shoulders 138px. Nunca se mueve. |
| **5 · Action zone** | Estado o botón | Altura fija. Rota entre texto de estado y botón "Terminé el colado". |

**Los cinco estados del ritual:**

1. **Prepárate** — solo al inicio, antes del bloom (el usuario aún no tiene la tetera en mano). Countdown de 10 segundos. El número gigante muestra los gramos del bloom. El status track marca "Preparación".
2. **Vertiendo** — el número gigante muestra **agua faltante** ("Faltan 23 g") con la meta secundaria ("Meta: hasta 45 g"). El cerebro piensa en agua que falta, no en segundos.
3. **Esperando** — reposo entre vertidos. El número muestra segundos hasta el próximo vertido.
4. **Colando** — el número muestra segundos hasta terminar. Botón "Terminé el colado" en la action zone.
5. **Fin** — servidor lleno, café listo. Transiciona al veredicto.

**El status track se adapta a la receta.** No son estados genéricos fijos — son los pasos reales. Para Hoffmann: Preparación → Bloom → Espera → Primer vertido → Espera → Segundo vertido → Espera → Cierre → Colado. Cada receta define su propia secuencia. (Nota de implementación: si una receta tiene muchos pasos, el status track necesita ser scrollable con auto-avance al paso activo, o comprimir visualmente los pasos lejanos. Decisión de implementación; el dato viene de la receta.)

**El aviso entre fases:** en los últimos 5 segundos antes de un cambio de fase (durante el ritual activo, no en la preparación), el número gigante **tintinea cromáticamente** entre tinta y café/marrón. Sin texto, sin banner. El usuario está vertiendo/esperando y no va a leer — solo percibe el cambio de color. Con Capacitor: vibración háptica aquí.

**El ritual termina** cuando el usuario toca "Terminé el colado" — mecánica ya existente en v1, no se rediseña. De ahí aparece "el café está servido" que llama al veredicto.

**Lottie (Arao):** `v60-ritual` — un solo archivo con cinco estados marcados (markers/frames): prepárate (tetera en espera), vertiendo (tetera vierte, agua entra al filtro), esperando (tetera aparta, agua asentándose), colando (agua cuela, café baja al servidor), fin (servidor lleno, últimas gotas). El servidor se va llenando progresivamente entre estados. ~258×174px, ratio 3:2. Formato `.lottie` (dotLottie) recomendado por los múltiples estados.

**⚑ Flag — contrato del Lottie:** antes de integrar, definir con Arao los markers exactos de cada estado y cómo se disparan desde `BrewState`. Ver §7.

---

### FASE 3 — VEREDICTO

#### P-05 · VEREDICTO
El clímax del ritual. El café está servido; una pregunta mínima; tres respuestas.

**Criterio de aceptación:**
- El Lottie del café servido ocupa **al menos 60% de la pantalla**. El café habla primero.
- Meta contextual arriba, sutil (receta · dosis · clic) — es lo que vincula el veredicto a la sesión.
- Una sola pregunta mínima ("¿Cómo estuvo?") en tono susurrado. Sin encabezado grande.
- Tres tarjetas (washi + embossed) con punto de color:
  - **ESTO ES.** (verde-oliva) → Éxito
  - **CASI.** (arena) → Diagnóstico
  - **HOY NO.** (ámbar) → Diagnóstico
- **El tap ES el registro.** El usuario que solo tapea ya registró su cata sin saberlo — solo expresó una emoción.
- Al tap, el sistema captura automáticamente receta + dosis + clic de molino + ajustes + timestamp desde `BrewState`. Ver C0.H6 / §7.

**Lottie (Arao):** `v60-servido` — servidor lleno, café humeante, vapor cálido, tetera en reposo. Loop contemplativo. ~258×340px (60% pantalla).

#### P-06 · DIAGNÓSTICO
El fracaso bien acompañado — el momento más importante del producto.

**Criterio de aceptación:**
- Sin título narrativo (el paso lógico es claro: venís de decir "Hoy no", ahora decís cómo se sintió).
- Meta arriba con el punto de color del veredicto que le dio origen.
- Grid 2×2 de tarjetas (washi + embossed) ocupando el máximo de pantalla: **Amarga / Ácida / Aguada / Apagada**, cada una con descripción mínima ("quema el paladar", etc.) en el lenguaje de Arao.
- Sin campo de texto libre.
- "Cerrar sin diagnóstico ×" siempre visible — el diagnóstico es opcional, el veredicto ya quedó guardado.

**⚑ Flag — reglas de diagnóstico:** ver §7.

#### P-07 · SUGERENCIA
La revancha. Una acción concreta, con profundidad opcional.

**Criterio de aceptación:**
- Meta contextual arriba.
- "Para la próxima," (susurro) + la acción en Big Shoulders grande con tamper ámbar ("BAJÁ UN CLIC.") + el target específico ("CLIC 3").
- Expandible "POR QUÉ ▾" con el razonamiento (sobre-extracción, molienda, etc.) — cerrado por defecto. El principiante no lo abre; el metódico sí.
- Dos salidas: "VOLVER AL INICIO" (secundario) y "GUARDAR SUGERENCIA" (marca ámbar). Guardar asocia el ajuste a la receta.
- Tono de coach, no de juicio. Sin "hiciste mal", sin "error".

**Copy del mapa sabor → sugerencia** (redacción final pendiente en voz de Arao):
- Amarga → bajá un clic el molino (sobre-extracción)
- Ácida → subí un clic el molino (sub-extracción)
- Aguada → subí la dosis o bajá el agua
- Apagada → revisá la temperatura del agua

#### P-08 · ÉXITO
La taza perfecta queda guardada. Sin confeti — el café en escena.

**Criterio de aceptación:**
- Lottie del servidor lleno (60% pantalla), variante con destello ámbar sutil — satisfacción, no euforia.
- Meta arriba con punto verde-oliva y fecha.
- Recap de la sesión: nombre de receta + cuatro datos en Big Shoulders (café, agua, clic, tiempo). Aquí el número grande se justifica: es la memoria concreta de qué funcionó.
- Dos salidas: "VOLVER AL INICIO" (secundario) y "GUARDAR TAZA" (primario tinta). Guardar marca la sesión como destacada para Capa 1.
- Auto-cierre suave o retorno manual al home.

**Lottie (Arao):** puede reusar `v60-servido` con un estado/variante ámbar adicional. Si se simplifica, es un solo Lottie con dos estados finales.

---

## 5. Historias técnicas de datos (para GUSTAVITO)

### C0.H6 — Veredicto ↔ sesión (BLOQUEANTE)
Al tap del veredicto, el sistema crea una entrada de sesión con: receta, dosis, clic de molino, ajustes manuales, timestamp, estado emocional (😍/😐/😞), y (si aplica) sabor diagnosticado + sugerencia. Arao no escribe ningún campo. Si abandona antes del veredicto, no se guarda.

**⚑ Requiere definir el tipo `BrewSession` en `engine/types.ts` antes de tocar la UI del veredicto.** Ver §7.

---

## 6. Fuera de Capa 0 (→ Capa 1)

Sin culpa, esperan a que el ritual esté construido y usado:
- Bitácora detallada navegable, con filtros y comparación entre sesiones
- Marcar receta como favorita
- Probar receta automáticamente con el ajuste sugerido
- Sección de Granos (registro, modelos 3D/CSS 3D de bolsas con válvula)
- Gamificación intrínseca (rachas de buenas tazas, granos dominados, evolución del paladar — nunca puntos ni badges)
- Estadísticas de tendencia del paladar

**Nota para el agente:** aunque estas features no se implementan, **no eliminar los datos de sesión ni el campo de ajuste sugerido** — se usan en Capa 1. El `BrewSession` debe guardar todo aunque la UI de Capa 0 no lo muestre.

---

## 7. Flags bloqueantes — resolver antes de codar

| Flag | Qué falta | Quién decide |
|---|---|---|
| **Tipo `BrewSession`** | Confirmar qué expone hoy `BrewState` y qué campos faltan para capturar la sesión completa. Definir el tipo en `engine/types.ts`. | GUSTAVITO (arquitectura) |
| **Contrato del Lottie del ritual** | Markers exactos de los 5 estados, cómo se disparan desde `BrewState`, formato `.lottie` vs `.json`, ubicación en repo (`/public/animations/`). | Arao + agente |
| **Reglas de diagnóstico** | ¿El mapa sabor → sugerencia usa el Brew suggestion engine de v1 (H6), o es un set simplificado nuevo para el flujo emocional? | GUSTAVITO + CASCARA |
| **Tipografía manuscrita** | Elegir reemplazo de Caveat. No bloquea el arranque; se puede usar placeholder. | Arao + CASCARA |
| **Copy de sugerencias** | Redacción final del mapa sabor → sugerencia en voz de Arao. | CASCARA |

---

## 8. Assets que produce Arao

**3 Lotties (After Effects → Bodymovin):**
1. `v60-idle` — Home. Simple. `.json`. ~260×260px.
2. `v60-ritual` — Ritual. 5 estados marcados. `.lottie`. ~258×174px.
3. `v60-servido` — Veredicto + Éxito. Con variante ámbar para éxito. `.json` o `.lottie`. ~258×340px.

**Ilustraciones estáticas:**
- Cara frontal y dorsal de cada receta (carrusel)
- (Opcional) wordmark FILTRADITOS en tinta seca final

**Reglas de export a Lottie:** todo en vector (shape layers), sin efectos no soportados por Bodymovin, nombres de layers limpios, markers en la timeline para los estados. Previsualizar en LottieFiles.com antes de entregar.

**Recomendación de pipeline:** empezar por `v60-idle` (el más simple) para validar el flujo de export completo antes del `v60-ritual` (el complejo).

---

## 9. Cómo sabremos que Capa 0 funciona

- Arao completa el arco sin cerrar antes del veredicto.
- Después de una taza mala, toca el diagnóstico (no solo cierra el "Hoy no").
- Después de 2 semanas, hay ≥1 sesión 😍 que recuerda sin que la app se lo recuerde.
- La palabra que usa para describir la app no es "útil" — es "me gusta".

---

## 10. Orden de construcción sugerido

Se puede empezar la UI **con placeholders de Lottie** (divs con las dimensiones exactas), en paralelo a que Arao diseña las animaciones. Los Lotties se enchufan al final sin refactor.

Primera entrega sugerida: **Home + Carrusel + Ritual** con placeholders funcionales, mientras Arao produce `v60-idle`.
