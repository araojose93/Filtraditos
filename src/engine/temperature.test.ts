import { describe, it, expect } from "vitest";
import { getWaterTemp, getWaterTempState } from "./temperature";

describe("getWaterTempState — modo de temperatura por tiempo", () => {
  it("t=0s → ideal (recién trasvasado, ~95 °C)", () => {
    expect(getWaterTempState(0)).toBe("ideal");
  });

  it("t=30s → ideal (aún >= 90 °C)", () => {
    expect(getWaterTempState(30)).toBe("ideal");
  });

  it("t=90s → bajando (entre 85 y 90 °C)", () => {
    expect(getWaterTempState(90)).toBe("bajando");
  });

  it("t=150s → fria (< 85 °C)", () => {
    expect(getWaterTempState(150)).toBe("fria");
  });
});

describe("getWaterTemp — curva de enfriamiento de Newton", () => {
  it("a t=0 arranca en 95 °C", () => {
    expect(getWaterTemp(0)).toBeCloseTo(95, 5);
  });

  it("decrece monótonamente con el tiempo", () => {
    expect(getWaterTemp(60)).toBeLessThan(getWaterTemp(0));
    expect(getWaterTemp(120)).toBeLessThan(getWaterTemp(60));
    expect(getWaterTemp(180)).toBeLessThan(getWaterTemp(120));
  });

  it("nunca baja del ambiente (29 °C) ni con tiempos enormes", () => {
    expect(getWaterTemp(100000)).toBeGreaterThanOrEqual(29);
  });

  it("normaliza tiempos negativos a t=0", () => {
    expect(getWaterTemp(-10)).toBeCloseTo(getWaterTemp(0), 5);
  });
});
