import { describe, it, expect } from "vitest";
import { getGrindClick } from "./grinder";
import { v60Facil, hoffmann, tetsuKasuya46 } from "./recipes";
import type { EquipmentProfile } from "./types";

const molino6: EquipmentProfile = { grinderClicks: 6, baseClick: 3 };

describe("getGrindClick — resuelve el clic relativo al perfil", () => {
  it("offset 0 usa el clic base", () => {
    expect(getGrindClick(molino6, 0)).toBe(3);
  });

  it("offset positivo va más grueso (sube el número de clic)", () => {
    expect(getGrindClick(molino6, 1)).toBe(4);
    expect(getGrindClick(molino6, 2)).toBe(5);
  });

  it("offset negativo va más fino (baja el número de clic)", () => {
    expect(getGrindClick(molino6, -1)).toBe(2);
    expect(getGrindClick(molino6, -2)).toBe(1);
  });

  it("nunca baja de 1 aunque el offset se pase de fino", () => {
    expect(getGrindClick(molino6, -3)).toBe(1); // 3-3 = 0 -> clamp a 1
    expect(getGrindClick(molino6, -10)).toBe(1);
  });

  it("nunca sube de grinderClicks aunque el offset se pase de grueso", () => {
    expect(getGrindClick(molino6, 3)).toBe(6); // 3+3 = 6, justo el tope
    expect(getGrindClick(molino6, 4)).toBe(6); // 3+4 = 7 -> clamp a 6
    expect(getGrindClick(molino6, 99)).toBe(6);
  });

  it("respeta el clic base de otros perfiles", () => {
    const molino10: EquipmentProfile = { grinderClicks: 10, baseClick: 5 };
    expect(getGrindClick(molino10, 0)).toBe(5);
    expect(getGrindClick(molino10, 4)).toBe(9);
    expect(getGrindClick(molino10, 6)).toBe(10); // clamp al tope de 10
  });
});

describe("getGrindClick — integra el offset recomendado de cada receta", () => {
  it("V60 Fácil y Hoffmann usan el clic base (offset 0)", () => {
    expect(getGrindClick(molino6, v60Facil(15).recommendedClickOffset)).toBe(3);
    expect(getGrindClick(molino6, hoffmann(30).recommendedClickOffset)).toBe(3);
  });

  it("Tetsu Kasuya 4:6 va un clic más grueso que la base (offset +1)", () => {
    expect(tetsuKasuya46(20).recommendedClickOffset).toBe(1);
    expect(getGrindClick(molino6, tetsuKasuya46(20).recommendedClickOffset)).toBe(4);
  });
});
