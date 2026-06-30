// Estimación de temperatura del agua sin termómetro (H4). El usuario hierve
// en olla y trasvasa a un gooseneck de acero frío: el agua arranca a ~95 °C
// y se enfría hacia el ambiente (Lechería, Venezuela, ~29 °C).
//
// Modelo: enfriamiento de Newton simplificado.
//   T(t) = T_amb + (T_0 - T_amb) * e^(-k * t)
// con T_amb = 29, T_0 = 95, k = 0.0015. Lógica pura, sin reloj real: la UI
// pasa los segundos transcurridos desde el trasvase y aquí se decide el modo.
//
// k = 0.0015 calibra la curva al gooseneck de acero fino con ambiente a
// 29 °C: el agua cruza los 90 °C cerca del minuto y sigue usable un buen
// rato. (Un k mayor, ~0.004, enfriaba irrealmente rápido — 81 °C al minuto.)

const T_AMBIENT = 29; // °C ambiente (Lechería, Venezuela)
const T_START = 95; // °C al caer en el gooseneck frío
const COOLING_K = 0.0015; // constante de enfriamiento (calibrada a los umbrales)

export type TempState = "ideal" | "bajando" | "fria";

/** Temperatura estimada del agua a `t` segundos del trasvase. */
export function getWaterTemp(secondsSincePour: number): number {
  const t = Math.max(0, secondsSincePour);
  return T_AMBIENT + (T_START - T_AMBIENT) * Math.exp(-COOLING_K * t);
}

/**
 * Modo de temperatura para la UI:
 *   "ideal"   → T >= 90 °C
 *   "bajando" → 85 °C <= T < 90 °C
 *   "fria"    → T < 85 °C
 */
export function getWaterTempState(secondsSincePour: number): TempState {
  const temp = getWaterTemp(secondsSincePour);
  if (temp >= 90) return "ideal";
  if (temp >= 85) return "bajando";
  return "fria";
}
