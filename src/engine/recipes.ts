// Catálogo de recetas tipadas (H2). Cada receta es un factory que toma la
// dosis real de café y devuelve un Recipe con el agua ya escalada — nada de
// dosis fija de ejemplo. La lógica de tiempo (startAt/pourDuration) la
// consume el engine; aquí solo se definen receta y proporciones.

import type { Recipe, RecipeStep } from "./types";

/** Segundos entre el arranque de un vertido y el siguiente ("cada 45s"). */
const POUR_INTERVAL = 45;
/** Segundos que dura cada vertido. Deja ~35s de espera antes del siguiente. */
const POUR_DURATION = 10;

/**
 * V60 Fácil — 1:16.7. Bloom (2× la dosis ≈ 30 g a 15 g de café) por 45 s,
 * y un único vertido final con el resto del agua.
 */
export function v60Facil(doseGrams: number): Recipe {
  const ratio = 16.7;
  const total = doseGrams * ratio;
  const bloom = 2 * doseGrams; // 30 g a la dosis de referencia de 15 g

  const steps: RecipeStep[] = [
    { startAt: 0, pourDuration: POUR_DURATION, waterAmount: bloom, label: "Bloom" },
    {
      startAt: POUR_INTERVAL,
      pourDuration: 30,
      waterAmount: total - bloom,
      label: "Vertido final",
    },
  ];

  return { id: "v60-facil", name: "V60 Fácil", ratio, steps };
}

/**
 * Hoffmann — 1:16.67 (60 g de café por litro). Exactamente 3 pasos:
 *  1. Bloom (t=0): 2× el peso del café. Vertido 10 s, swirl, espera a t=45.
 *  2. Primer vertido (t=45): hasta acumular el 60 % del agua total.
 *     Vertido 30 s, espera a t=75.
 *  3. Segundo vertido (t=75): el 40 % restante hasta el 100 %. Vertido 30 s,
 *     espera el drawdown. Objetivo: todo terminado a 3:30.
 *
 * Ej. 30 g café: bloom=60, total≈500, vertido 1 acumula 300, vertido 2 a 500.
 */
export function hoffmann(doseGrams: number): Recipe {
  const ratio = 16.67;
  const total = doseGrams * ratio;
  const bloom = 2 * doseGrams;

  // waterAmount es el agua *de ese paso* (incremental). Los acumulados caen
  // en bloom -> 60 % del total -> 100 % del total.
  const firstPour = total * 0.6 - bloom; // lleva el acumulado al 60 %
  const secondPour = total * 0.4; // el 40 % restante

  const steps: RecipeStep[] = [
    { startAt: 0, pourDuration: 10, waterAmount: bloom, label: "Bloom" },
    { startAt: 45, pourDuration: 30, waterAmount: firstPour, label: "Primer vertido (60%)" },
    { startAt: 75, pourDuration: 30, waterAmount: secondPour, label: "Segundo vertido (100%)" },
  ];

  return { id: "hoffmann", name: "Hoffmann", ratio, steps };
}

/**
 * Tetsu Kasuya 4:6 — 1:15. Cinco vertidos espaciados cada 45 s. Los primeros
 * 2 vertidos suman el 40 % del agua; los últimos 3 suman el 60 %.
 */
export function tetsuKasuya46(doseGrams: number): Recipe {
  const ratio = 15;
  const total = doseGrams * ratio;

  const phase1Each = (total * 0.4) / 2; // primeros 2 vertidos (40 %)
  const phase2Each = (total * 0.6) / 3; // últimos 3 vertidos (60 %)

  const steps: RecipeStep[] = [
    { startAt: 0 * POUR_INTERVAL, pourDuration: POUR_DURATION, waterAmount: phase1Each, label: "Vertido 1 (40%)" },
    { startAt: 1 * POUR_INTERVAL, pourDuration: POUR_DURATION, waterAmount: phase1Each, label: "Vertido 2 (40%)" },
    { startAt: 2 * POUR_INTERVAL, pourDuration: POUR_DURATION, waterAmount: phase2Each, label: "Vertido 3 (60%)" },
    { startAt: 3 * POUR_INTERVAL, pourDuration: POUR_DURATION, waterAmount: phase2Each, label: "Vertido 4 (60%)" },
    { startAt: 4 * POUR_INTERVAL, pourDuration: POUR_DURATION, waterAmount: phase2Each, label: "Vertido 5 (60%)" },
  ];

  return { id: "tetsu-46", name: "Tetsu Kasuya 4:6", ratio, steps };
}

/** Registro de factories por id, para construir recetas por dosis. */
export const recipeBuilders = {
  "v60-facil": v60Facil,
  hoffmann: hoffmann,
  "tetsu-46": tetsuKasuya46,
} as const;

export type RecipeId = keyof typeof recipeBuilders;

/** Construye una receta del catálogo escalada a la dosis dada. */
export function buildRecipe(id: RecipeId, doseGrams: number): Recipe {
  return recipeBuilders[id](doseGrams);
}
