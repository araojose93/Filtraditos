# BrewLab — contexto para Claude Code

PWA tipo coach de preparación V60. Cronómetro guiado que dice cuándo verter
y cuándo esperar, perfil de equipo (molino de clics), pestaña de
enfriamiento de agua, y bitácora de catas.

## Personas del proyecto
- **CASCARA** (`agents/CASCARA.md`) — agente de producto. Decide qué
  construir y por qué, basado en impacto real en la taza.
- **GUSTAVITO** (`agents/GUSTAVITO.md`) — yo, CTO/arquitecto. Decide cómo
  se construye. Si una tarea no tiene spec clara de CASCARA, primero se
  define la spec, después se codea.

Antes de implementar una feature nueva, lee ambos agentes para mantener el
tono y los criterios de decisión.

## Regla de oro de este repo
**La lógica de la receta vive en `src/engine/`, separada de la UI, y es
pura (sin DOM, sin timers, sin `Date.now()` directo).** Esto no es
preferencia estética: el bug original de la v1 (el cronómetro siempre
decía "vierte", nunca "espera") pasó porque la lógica de vertido vivía
mezclada con el render. Con el engine puro, ese tipo de bug se atrapa con
un test de una línea — ver `src/engine/brewEngine.test.ts`.

**Si vas a tocar reglas de tiempo, agua, o modo vierte/espera: el cambio
empieza en `src/engine/`, con un test que falle antes del fix y pase
después.** La UI (`src/ui/`) solo lee `BrewState` y pinta — no decide nada.

## Stack
- Vite + TypeScript + Vitest
- vite-plugin-pwa (manifest + service worker, ver `vite.config.ts`)
- Capacitor se agrega después, cuando la PWA esté estable, para el build
  nativo de Android (wake lock real, haptics reales)

## Estructura
```
src/
  engine/         <- lógica pura, testeada. NO importa nada de UI.
    types.ts
    brewEngine.ts
    brewEngine.test.ts
    recipes.ts    <- (pendiente) catálogo de recetas tipadas
  ui/             <- componentes / render. Solo consume el engine.
agents/
  CASCARA.md
  GUSTAVITO.md
public/
  icons/
```

## Convenciones
- Español en UI, copy, nombres de recetas y comentarios de negocio.
  Inglés está bien en nombres de variables/funciones técnicas si es más
  natural (`getBrewState`, `pourDuration`).
- Cada función del engine que tenga una regla de café (ritmo, ventanas de
  tiempo, escalado por dosis) necesita al menos un test.
- No se asume equipo ideal: el molino tiene N clics configurables (no
  "fino/medio/grueso" fijo), la temperatura es estimada por tiempo (no hay
  termómetro), el agua vertida es estimada (no hay báscula con lectura
  instantánea). Toda feature debe funcionar bien con esas limitaciones.

## Cómo correr esto
```
npm install
npm test        # corre el engine test suite
npm run dev      # levanta la app en local
```

## Estado actual / próximos pasos sugeridos
1. ✅ Engine de vertido/espera con tests (este commit).
2. ⬜ Migrar el catálogo de recetas (Fácil, Hoffmann, Kasuya) a
   `src/engine/recipes.ts` tipado con `Recipe`.
3. ⬜ Portar la UI del prototipo HTML a componentes que consuman
   `getBrewState()` en vez de la lógica vieja mezclada.
4. ⬜ "Confirmar peso real" + diagnóstico desde la cata (sugerencia de
   CASCARA, ver backlog de producto).
5. ⬜ Wrap con Capacitor para Android nativo.
