// Motor puro de vertido/espera. Esta es la pieza que en v1 vivía mezclada
// con el render y por eso el cronómetro "siempre decía vierte, nunca espera".
// Aquí es pura y testeable: dado un tiempo, dice en qué paso estás y si
// toca verter o esperar.

import type { Recipe, RecipeStep } from "./types";

export type BrewPhase = "vierte" | "espera";

export interface BrewState {
  /** "vierte" mientras dura el vertido del paso; "espera" después. */
  phase: BrewPhase;
  /** Índice del paso activo dentro de recipe.steps. */
  stepIndex: number;
  /** El paso activo. */
  step: RecipeStep;
  /** Agua total objetivo del brew = dosis * ratio. */
  totalWater: number;
  /** Gramos de agua de este vertido. */
  currentPourWater: number;
  /** Agua acumulada objetivo al terminar el paso actual. */
  targetWaterSoFar: number;
  /** Tiempo transcurrido normalizado (nunca negativo). */
  elapsedSeconds: number;
}

/**
 * Estado del brew en un instante dado. Función pura: mismas entradas,
 * mismo resultado, sin tocar el reloj real.
 *
 * @param recipe  receta ya escalada a la dosis (ver recipes.ts)
 * @param doseGrams  dosis de café en gramos (define el agua total)
 * @param elapsedSeconds  segundos desde el arranque del cronómetro
 */
export function getBrewState(
  recipe: Recipe,
  doseGrams: number,
  elapsedSeconds: number
): BrewState {
  const steps = recipe.steps;
  if (steps.length === 0) {
    throw new Error(`La receta "${recipe.id}" no tiene pasos.`);
  }

  const t = Math.max(0, elapsedSeconds);

  // Paso activo = el último cuyo startAt ya pasó. startAt es creciente,
  // así que en cuanto encontramos uno futuro podemos cortar.
  let stepIndex = 0;
  for (let i = 0; i < steps.length; i++) {
    if (t >= steps[i].startAt) {
      stepIndex = i;
    } else {
      break;
    }
  }

  const step = steps[stepIndex];

  // Dentro del paso: viertes hasta cumplir pourDuration; luego esperas.
  const pourEndsAt = step.startAt + step.pourDuration;
  const phase: BrewPhase = t < pourEndsAt ? "vierte" : "espera";

  let targetWaterSoFar = 0;
  for (let i = 0; i <= stepIndex; i++) {
    targetWaterSoFar += steps[i].waterAmount;
  }

  return {
    phase,
    stepIndex,
    step,
    totalWater: doseGrams * recipe.ratio,
    currentPourWater: step.waterAmount,
    targetWaterSoFar,
    elapsedSeconds: t,
  };
}
