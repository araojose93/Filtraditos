import { describe, it, expect } from "vitest";
import { getBrewState } from "./brewEngine";
import { v60Facil, hoffmann, tetsuKasuya46 } from "./recipes";
import type { Recipe } from "./types";

// El bug original de v1: el cronómetro siempre decía "vierte", nunca "espera".
// Este helper recorre TODOS los pasos de una receta y verifica la transición
// vierte -> espera justo al cumplirse pourDuration. Si el engine se rompe,
// falla aquí en una línea, no en la UI.
function assertPourThenWait(recipe: Recipe, dose: number) {
  recipe.steps.forEach((step, i) => {
    // Al arrancar el vertido: "vierte".
    const start = getBrewState(recipe, dose, step.startAt);
    expect(start.phase, `${recipe.id} paso ${i} @start`).toBe("vierte");
    expect(start.stepIndex, `${recipe.id} paso ${i} index`).toBe(i);

    // Un segundo antes de cumplir pourDuration: sigue "vierte".
    const mid = getBrewState(recipe, dose, step.startAt + step.pourDuration - 1);
    expect(mid.phase, `${recipe.id} paso ${i} @mid`).toBe("vierte");

    // Al cumplirse pourDuration consultamos el estado.
    const pourEnd = step.startAt + step.pourDuration;
    const after = getBrewState(recipe, dose, pourEnd);
    const next = recipe.steps[i + 1];

    if (next && pourEnd >= next.startAt) {
      // El siguiente vertido arranca justo al terminar este (ventana de
      // espera de cero, como el paso 2 de Hoffmann): debe encadenar a
      // "vierte" en el paso siguiente, no inventar una espera fantasma.
      expect(after.phase, `${recipe.id} paso ${i} @end -> siguiente`).toBe("vierte");
      expect(after.stepIndex, `${recipe.id} paso ${i} @end avanza`).toBe(i + 1);
    } else {
      // Hay hueco real antes del siguiente paso (o es el último, con
      // drawdown): la transición vierte->espera debe ocurrir.
      expect(after.phase, `${recipe.id} paso ${i} @end`).toBe("espera");
    }
  });
}

describe("getBrewState — transición vierte/espera por receta", () => {
  it("V60 Fácil pasa a espera al cumplirse pourDuration de cada paso", () => {
    assertPourThenWait(v60Facil(15), 15);
  });

  it("Hoffmann pasa a espera al cumplirse pourDuration de cada paso", () => {
    assertPourThenWait(hoffmann(18), 18);
  });

  it("Hoffmann tiene exactamente 3 pasos (bloom, 60%, 100%) en t=0/45/75", () => {
    const r = hoffmann(30);
    expect(r.steps).toHaveLength(3);
    expect(r.steps.map((s) => s.startAt)).toEqual([0, 45, 75]);
    expect(r.steps.map((s) => s.pourDuration)).toEqual([10, 30, 30]);
  });

  it("Tetsu Kasuya 4:6 pasa a espera al cumplirse pourDuration de cada paso", () => {
    assertPourThenWait(tetsuKasuya46(20), 20);
  });
});

describe("getBrewState — comportamiento general", () => {
  it("antes del primer vertido (t<0 normalizado) arranca en el paso 0 vertiendo", () => {
    const r = v60Facil(15);
    const s = getBrewState(r, 15, -5);
    expect(s.elapsedSeconds).toBe(0);
    expect(s.stepIndex).toBe(0);
    expect(s.phase).toBe("vierte");
  });

  it("reporta el agua del vertido actual y la acumulada", () => {
    const r = tetsuKasuya46(20); // total 300 g, 20 % por vertido = 60 g
    const s = getBrewState(r, 20, 90); // tercer vertido
    expect(s.stepIndex).toBe(2);
    expect(s.currentPourWater).toBeCloseTo(60, 5);
    expect(s.targetWaterSoFar).toBeCloseTo(180, 5); // 3 vertidos de 60 g
  });

  it("lanza error si la receta no tiene pasos", () => {
    const empty: Recipe = { id: "vacia", name: "Vacía", ratio: 16, steps: [], recommendedClickOffset: 0 };
    expect(() => getBrewState(empty, 15, 0)).toThrow();
  });
});

describe("recetas — recálculo de agua por dosis (H2)", () => {
  it("Hoffmann: agua total y por vertido coherentes con la proporción a 18 g", () => {
    const dose = 18;
    const r = hoffmann(dose);
    const total = dose * r.ratio;

    // total = dosis * ratio (1:16.67)
    expect(total).toBeCloseTo(300.06, 5);

    // la suma de todos los vertidos = agua total
    const sum = r.steps.reduce((acc, s) => acc + s.waterAmount, 0);
    expect(sum).toBeCloseTo(total, 5);

    // bloom = 2× el café
    expect(r.steps[0].waterAmount).toBeCloseTo(2 * dose, 5);

    // getBrewState reporta el mismo total
    expect(getBrewState(r, dose, 0).totalWater).toBeCloseTo(total, 5);
  });

  it("Hoffmann: acumulados caen en bloom -> 60% -> 100% (ej. 30 g)", () => {
    const dose = 30;
    const r = hoffmann(dose);
    const total = dose * r.ratio; // ≈ 500.1

    // Acumulado al terminar cada paso (lo reporta getBrewState).
    expect(getBrewState(r, dose, 0).targetWaterSoFar).toBeCloseTo(60, 5); // bloom 2×30
    expect(getBrewState(r, dose, 45).targetWaterSoFar).toBeCloseTo(total * 0.6, 5); // 60%
    expect(getBrewState(r, dose, 75).targetWaterSoFar).toBeCloseTo(total, 5); // 100%

    // El primer vertido principal lleva el acumulado del bloom hasta el 60%.
    expect(r.steps[1].waterAmount).toBeCloseTo(total * 0.6 - 2 * dose, 5);
    // El segundo aporta el 40% restante.
    expect(r.steps[2].waterAmount).toBeCloseTo(total * 0.4, 5);
  });

  it("Hoffmann escala con la dosis: el doble de café => el doble de agua", () => {
    const a = hoffmann(18).steps.reduce((acc, s) => acc + s.waterAmount, 0);
    const b = hoffmann(36).steps.reduce((acc, s) => acc + s.waterAmount, 0);
    expect(b).toBeCloseTo(2 * a, 5);
  });

  it("Tetsu Kasuya 4:6: primeros 2 vertidos = 40 % y últimos 3 = 60 %", () => {
    const dose = 20;
    const r = tetsuKasuya46(dose);
    const total = dose * r.ratio;
    const first2 = r.steps[0].waterAmount + r.steps[1].waterAmount;
    const last3 = r.steps[2].waterAmount + r.steps[3].waterAmount + r.steps[4].waterAmount;
    expect(first2).toBeCloseTo(total * 0.4, 5);
    expect(last3).toBeCloseTo(total * 0.6, 5);
  });
});
