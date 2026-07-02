# Filtraditos — contexto para Claude Code

App de café de especialidad (V60 hand drip). **No es una app de cronómetro
— es una app de aprender a paladear.** Antes se llamaba BrewLab; el engine
de v1 sigue vigente, lo que cambia en Capa 0 es toda la experiencia/UI.

**Principio rector: la interfaz ES el producto.** Las animaciones Lottie
son funcionalidad central, no decoración. Una pantalla que funciona pero se
siente tediosa o genérica NO cumple el criterio de aceptación.

## Personas del proyecto
- **CASCARA** (`agents/CASCARA.md`) — agente de producto y diseño. Decide
  qué construir, por qué, y cómo se ve/siente.
- **GUSTAVITO** (`agents/GUSTAVITO.md`) — CTO/arquitecto. Decide cómo se
  construye. Si una tarea no tiene spec clara, primero se define, después
  se codea.

Antes de implementar algo nuevo, lee ambos agentes y los documentos de
producto/diseño referenciados abajo.

## Documentos de producto y diseño (leer antes de tocar UI de Capa 0)
- `docs/Filtraditos-Capa0-Spec-v2.md` — las pantallas, el arco, los
  criterios de aceptación, los flags bloqueantes.
- `docs/Filtraditos-Sistema-Diseno-v1.md` — paleta, tipografía, superficie
  (tarjetas/botones), ilustración, movimiento. **Autoritativo para
  cualquier decisión visual.**

## Regla de oro de este repo (NO CAMBIA)
**La lógica de la receta vive en `src/engine/`, separada de la UI, y es
pura (sin DOM, sin timers, sin `Date.now()` directo).** El bug original de
la v1 (el cronómetro siempre decía "vierte", nunca "espera") pasó porque la
lógica de vertido vivía mezclada con el render. Con el engine puro, ese bug
se atrapa con un test de una línea — ver `src/engine/brewEngine.test.ts`.

**Si vas a tocar reglas de tiempo, agua, o modo vierte/espera: el cambio
empieza en `src/engine/`, con un test que falle antes del fix y pase
después.** La UI (`src/ui/`) solo lee estado y pinta — no decide nada.

## La UI de Capa 0 NO toca el engine
El rediseño de Capa 0 es una capa de presentación nueva sobre el engine
existente. Salvo el flag de `BrewSession` (ver abajo), el trabajo de Capa 0
vive en `src/ui/` y consume `getBrewState()`. No reescribir el engine para
acomodar la UI.

## Stack
- Vite + TypeScript + Vitest (sin frameworks de UI pesados)
- vite-plugin-pwa (manifest + service worker, ver `vite.config.ts`)
- Lottie: `lottie-web` para `.json`, o `@lottiefiles/dotlottie-react` /
  `@lottiefiles/dotlottie-web` para `.lottie` (el ritual usa `.lottie` por
  sus múltiples estados). Confirmar cuál se instala al integrar.
- Capacitor se agrega después (haptics reales para el tintineo de aviso,
  wake lock durante el ritual).

## Estructura
```
src/
  engine/              <- lógica pura, testeada. NO importa nada de UI.
    types.ts           <- incluye Recipe, BrewState y (pendiente) BrewSession
    brewEngine.ts
    brewEngine.test.ts
    recipes.ts         <- catálogo tipado (Fácil, Hoffmann, Kasuya)
  ui/
    theme/             <- tokens de diseño, fondo washi, estilos base
    components/        <- Card, Button (4 variantes), StatusTrack, BigNumber...
    screens/           <- Home, Recipes, Prep, Ritual, Verdict, Diagnosis,
                          Suggestion, Success
    lottie/            <- wrappers de Lottie + placeholders durante desarrollo
agents/
  CASCARA.md
  GUSTAVITO.md
docs/
  Filtraditos-Capa0-Spec-v2.md
  Filtraditos-Sistema-Diseno-v1.md
public/
  animations/          <- .json / .lottie que entrega Arao
  icons/
```

## Sistema de diseño — resumen operativo
(Detalle completo en `docs/Filtraditos-Sistema-Diseno-v1.md`.)

- **Paleta:** papel `#F5F0E4`, tarjeta `#F0EAD8`, tinta `#120A02`, ámbar
  `#9B5602` (acento único, máximo 2-3 por pantalla). NO monocromático café,
  NO negro puro, NO azul, NO glassmorphism.
- **Tipografía:** Big Shoulders Display 900 **solo para lo útil**
  (contadores, números del ritual, valores de acción) — nunca para títulos
  narrativos. DM Sans para interfaz. Manuscrita (pendiente de elegir) solo
  para el momento emocional del veredicto.
- **Superficie:** tarjetas y botones washi + embossed reforzado, radio 4px
  (esquinas casi cuadradas). Nada de bordes finos de 1px con sombra oscura.
- **Botones:** 4 roles — primario (tinta + tamper ámbar), secundario
  (papel), marca (papel ámbar tenue), tinta de proceso (tinta sin tamper).
- **Ilustración:** línea única, tinta seca con `feDisplacementMap` para
  bordes irregulares hechos a mano.

## Lotties — integración
Arao los diseña en After Effects y los exporta con Bodymovin. Se pueden
implementar las pantallas con **placeholders** (un div con las dimensiones
exactas del Lottie) mientras las animaciones no estén listas; se enchufan
al final sin refactor. Dimensiones:
- `v60-idle` (Home): ~260×260
- `v60-ritual` (Ritual, 5 estados): ~258×174
- `v60-servido` (Veredicto/Éxito): ~258×340

## Convenciones
- Español en UI, copy, nombres de recetas y comentarios de negocio. Inglés
  ok en variables/funciones técnicas (`getBrewState`, `pourDuration`).
- Cada función del engine con una regla de café (ritmo, ventanas de tiempo,
  escalado por dosis) necesita al menos un test.
- No se asume equipo ideal: molino de N clics configurables (no
  "fino/medio/grueso"), temperatura estimada por tiempo, agua vertida
  estimada. Toda feature funciona con esas limitaciones.
- Los datos de sesión (`BrewSession`) se guardan completos aunque la UI de
  Capa 0 no los muestre — se usan en Capa 1. No los borres "porque no se
  usan todavía".

## Flags bloqueantes de Capa 0 (ver spec §7)
1. **`BrewSession` en `engine/types.ts`** — necesario para el veredicto
   (C0.H6). Confirmar qué expone hoy `BrewState` y qué falta. Esto SÍ toca
   el engine y va con test.
2. **Contrato del Lottie del ritual** — markers de los 5 estados y cómo se
   disparan desde `BrewState`. Definir con Arao antes de integrar.
3. **Reglas de diagnóstico** — ¿reusar el suggestion engine de v1 o set
   nuevo? Definir con CASCARA/GUSTAVITO antes de la pantalla de sugerencia.

## Cómo correr esto
```
npm install
npm test         # engine test suite
npm run dev      # levanta la app en local
```

## Estado actual / próximos pasos
1. ✅ Engine de vertido/espera con tests.
2. ✅ Catálogo de recetas tipado (`recipes.ts`).
3. ✅ Estimación de temperatura, perfil de molino, bitácora básica (v1).
4. 🔨 **Capa 0 — rediseño de experiencia (en curso).** Empezar por
   Home + Carrusel + Ritual con placeholders de Lottie, en paralelo a que
   Arao produce `v60-idle`.
5. ⬜ Resolver flag `BrewSession` (bloquea el veredicto).
6. ⬜ Integrar Lotties cuando Arao los entregue.
7. ⬜ Capa 1 (bitácora navegable, granos, gamificación intrínseca).
8. ⬜ Wrap con Capacitor para Android nativo.
