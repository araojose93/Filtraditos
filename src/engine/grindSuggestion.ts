// Sugerencia automática de ajuste de molienda (H7). Lógica pura: dado el
// tiempo real vs el esperado y los sabores de la cata, sugiere moler más fino
// o más grueso SOLO cuando tiempo y sabor son coherentes con una sub/sobre-
// extracción. En cualquier otro caso devuelve null — no inventamos consejos.

/** Umbrales de desviación de tiempo (±15%). */
const FAST = 0.85;
const SLOW = 1.15;

export interface GrindSuggestion {
  direction: "mas_fino" | "mas_grueso";
  /** Texto breve para mostrar al usuario. */
  reason: string;
}

export function getGrindSuggestion(params: {
  actualSeconds: number;
  expectedSeconds: number;
  tastes: string[];
}): GrindSuggestion | null {
  const { actualSeconds, expectedSeconds, tastes } = params;
  if (expectedSeconds <= 0) return null;

  // Drenó mucho más rápido + sabor de sub-extracción → moler más fino.
  if (
    actualSeconds < expectedSeconds * FAST &&
    (tastes.includes("Ácido") || tastes.includes("Aguado"))
  ) {
    return {
      direction: "mas_fino",
      reason:
        "Coló muy rápido y salió ácido/aguado — típico de sub-extracción. Prueba 1 clic más fino.",
    };
  }

  // Drenó mucho más lento + amargo → moler más grueso.
  if (actualSeconds > expectedSeconds * SLOW && tastes.includes("Amargo")) {
    return {
      direction: "mas_grueso",
      reason:
        "Coló muy lento y salió amargo — típico de sobre-extracción. Prueba 1 clic más grueso.",
    };
  }

  return null;
}
