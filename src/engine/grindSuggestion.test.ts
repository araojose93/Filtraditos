import { describe, it, expect } from "vitest";
import { getGrindSuggestion } from "./grindSuggestion";

// Usamos el target real de V60 Fácil (180 s). Umbrales:
//   rápido  → actual < 180 * 0.85 = 153
//   lento   → actual > 180 * 1.15 = 207
const EXPECTED = 180;

describe("getGrindSuggestion", () => {
  it("rápido + Ácido → más fino", () => {
    const s = getGrindSuggestion({
      actualSeconds: 140, // < 153
      expectedSeconds: EXPECTED,
      tastes: ["Ácido"],
    });
    expect(s?.direction).toBe("mas_fino");
    expect(s?.reason).toMatch(/más fino/i);
  });

  it("rápido + Aguado → más fino", () => {
    const s = getGrindSuggestion({
      actualSeconds: 140,
      expectedSeconds: EXPECTED,
      tastes: ["Aguado", "Dulce"],
    });
    expect(s?.direction).toBe("mas_fino");
  });

  it("lento + Amargo → más grueso", () => {
    const s = getGrindSuggestion({
      actualSeconds: 220, // > 207
      expectedSeconds: EXPECTED,
      tastes: ["Amargo"],
    });
    expect(s?.direction).toBe("mas_grueso");
    expect(s?.reason).toMatch(/más grueso/i);
  });

  it("tiempo normal con sabor amargo → null (sin desviación de tiempo)", () => {
    const s = getGrindSuggestion({
      actualSeconds: 180, // dentro de rango
      expectedSeconds: EXPECTED,
      tastes: ["Amargo"],
    });
    expect(s).toBeNull();
  });

  it("rápido pero Amargo → null (sabor no coherente con drenado rápido)", () => {
    const s = getGrindSuggestion({
      actualSeconds: 140,
      expectedSeconds: EXPECTED,
      tastes: ["Amargo"],
    });
    expect(s).toBeNull();
  });

  it("lento pero Ácido → null (sabor no coherente con drenado lento)", () => {
    const s = getGrindSuggestion({
      actualSeconds: 220,
      expectedSeconds: EXPECTED,
      tastes: ["Ácido"],
    });
    expect(s).toBeNull();
  });

  it("expectedSeconds inválido → null", () => {
    expect(
      getGrindSuggestion({ actualSeconds: 10, expectedSeconds: 0, tastes: ["Ácido"] })
    ).toBeNull();
  });
});
