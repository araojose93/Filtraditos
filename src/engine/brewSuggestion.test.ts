import { describe, it, expect } from "vitest";
import { getBrewSuggestion } from "./brewSuggestion";

// Target real de V60 Fácil (180 s). Umbrales:
//   rápido  → actual < 180 * 0.85 = 153
//   lento   → actual > 180 * 1.15 = 207
const EXPECTED = 180;

describe("getBrewSuggestion — molienda", () => {
  it("rápido + Ácido → más fino", () => {
    const s = getBrewSuggestion({ actualSeconds: 140, expectedSeconds: EXPECTED, tastes: ["Ácido"] });
    expect(s?.direction).toBe("mas_fino");
    expect(s?.reason).toMatch(/ácido/i);
    expect(s?.reason).toMatch(/más fino/i);
  });

  it("rápido + Aguado (sin Ácido) → más fino, texto 'aguado'", () => {
    const s = getBrewSuggestion({ actualSeconds: 140, expectedSeconds: EXPECTED, tastes: ["Aguado", "Dulce"] });
    expect(s?.direction).toBe("mas_fino");
    expect(s?.reason).toMatch(/salió aguado/i);
  });

  it("rápido + Ácido + Aguado → texto combinado 'ácido y aguado'", () => {
    const s = getBrewSuggestion({ actualSeconds: 140, expectedSeconds: EXPECTED, tastes: ["Ácido", "Aguado"] });
    expect(s?.reason).toMatch(/ácido y aguado/i);
  });

  it("lento + Amargo → más grueso", () => {
    const s = getBrewSuggestion({ actualSeconds: 220, expectedSeconds: EXPECTED, tastes: ["Amargo"] });
    expect(s?.direction).toBe("mas_grueso");
    expect(s?.reason).toMatch(/más grueso/i);
  });

  it("lento + Astringente/Seco (sin Amargo) → más grueso, texto 'astringente'", () => {
    const s = getBrewSuggestion({ actualSeconds: 220, expectedSeconds: EXPECTED, tastes: ["Astringente/Seco"] });
    expect(s?.direction).toBe("mas_grueso");
    expect(s?.reason).toMatch(/salió astringente/i);
  });
});

describe("getBrewSuggestion — temperatura (Quemado)", () => {
  it("Quemado solo, tiempo normal → revisar_temperatura", () => {
    const s = getBrewSuggestion({ actualSeconds: 180, expectedSeconds: EXPECTED, tastes: ["Quemado"] });
    expect(s?.direction).toBe("revisar_temperatura");
    expect(s?.reason).toMatch(/hirviendo/i);
  });

  it("Quemado + Ácido → revisar_temperatura gana (regla 1 tiene prioridad)", () => {
    const s = getBrewSuggestion({ actualSeconds: 140, expectedSeconds: EXPECTED, tastes: ["Quemado", "Ácido"] });
    expect(s?.direction).toBe("revisar_temperatura");
  });

  it("Quemado no depende del tiempo (rápido) → revisar_temperatura", () => {
    const s = getBrewSuggestion({ actualSeconds: 140, expectedSeconds: EXPECTED, tastes: ["Quemado"] });
    expect(s?.direction).toBe("revisar_temperatura");
  });
});

describe("getBrewSuggestion — casos null", () => {
  it("tiempo normal con sabor amargo → null", () => {
    expect(getBrewSuggestion({ actualSeconds: 180, expectedSeconds: EXPECTED, tastes: ["Amargo"] })).toBeNull();
  });

  it("rápido pero Amargo → null", () => {
    expect(getBrewSuggestion({ actualSeconds: 140, expectedSeconds: EXPECTED, tastes: ["Amargo"] })).toBeNull();
  });

  it("lento pero Ácido → null", () => {
    expect(getBrewSuggestion({ actualSeconds: 220, expectedSeconds: EXPECTED, tastes: ["Ácido"] })).toBeNull();
  });

  it("rápido + Astringente/Seco (no coherente) → null", () => {
    expect(getBrewSuggestion({ actualSeconds: 140, expectedSeconds: EXPECTED, tastes: ["Astringente/Seco"] })).toBeNull();
  });

  it("expectedSeconds inválido sin Quemado → null", () => {
    expect(getBrewSuggestion({ actualSeconds: 10, expectedSeconds: 0, tastes: ["Ácido"] })).toBeNull();
  });
});
