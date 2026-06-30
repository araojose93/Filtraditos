// Coach de sugerencias de preparación (H7+). Lógica pura: dado el tiempo real
// vs el esperado y los sabores de la cata, sugiere un ajuste concreto. Las
// reglas se evalúan en orden; la primera que matchee gana. Si nada matchea
// (tiempo en rango, o sabor no coherente con la desviación), devuelve null —
// no inventamos consejos.

/** Umbrales de desviación de tiempo (±15%). */
const FAST = 0.85;
const SLOW = 1.15;

export interface BrewSuggestion {
  direction: "mas_fino" | "mas_grueso" | "revisar_temperatura";
  /** Texto breve para mostrar al usuario. */
  reason: string;
}

export function getBrewSuggestion(params: {
  actualSeconds: number;
  expectedSeconds: number;
  tastes: string[];
}): BrewSuggestion | null {
  const { actualSeconds, expectedSeconds, tastes } = params;

  // 1. Quemado → temperatura. No es molienda y no depende del tiempo.
  if (tastes.includes("Quemado")) {
    return {
      direction: "revisar_temperatura",
      reason:
        "Sabor a quemado no suele ser molienda — revisa que el agua no esté hirviendo al verter. Usa la pestaña Agua para guiarte.",
    };
  }

  if (expectedSeconds <= 0) return null;

  // 2. Drenó mucho más rápido + sabor de sub-extracción → moler más fino.
  if (actualSeconds < expectedSeconds * FAST) {
    const acido = tastes.includes("Ácido");
    const aguado = tastes.includes("Aguado");
    if (acido || aguado) {
      const flavor = acido && aguado ? "ácido y aguado" : acido ? "ácido" : "aguado";
      return {
        direction: "mas_fino",
        reason: `Coló muy rápido y salió ${flavor} — típico de sub-extracción. Prueba 1 clic más fino.`,
      };
    }
  }

  // 3. Drenó mucho más lento + sabor de sobre-extracción → moler más grueso.
  if (actualSeconds > expectedSeconds * SLOW) {
    const amargo = tastes.includes("Amargo");
    const seco = tastes.includes("Astringente/Seco");
    if (amargo || seco) {
      const flavor =
        amargo && seco ? "amargo y astringente" : amargo ? "amargo" : "astringente";
      return {
        direction: "mas_grueso",
        reason: `Coló muy lento y salió ${flavor} — típico de sobre-extracción. Prueba 1 clic más grueso.`,
      };
    }
  }

  return null;
}
