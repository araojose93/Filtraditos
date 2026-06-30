// Perfil de molino por clics (H3). Lógica pura: dado el perfil del usuario
// y un offset (de la receta o de un ajuste manual), resuelve el clic final.
// No hay categorías "fino/medio/grueso": todo es número de clic.

import type { EquipmentProfile } from "./types";

/**
 * Clic resultante = baseClick + offset, recortado al rango físico del molino
 * [1, grinderClicks]. Nunca devuelve un clic que el molino no tiene.
 *
 * @param profile  molino del usuario (total de clics + clic base)
 * @param offset   ajuste relativo al clic base (+grueso / -fino)
 */
export function getGrindClick(profile: EquipmentProfile, offset: number): number {
  const target = profile.baseClick + offset;
  return Math.min(profile.grinderClicks, Math.max(1, target));
}

/**
 * Ajusta un clic CONCRETO en `delta` pasos (ej. -1 más fino, +1 más grueso),
 * recortado a [1, grinderClicks]. Para "repetir con ajuste" (H8): el ajuste es
 * relativo al clic que realmente se usó, no al baseClick del perfil.
 */
export function adjustGrindClick(
  currentClick: number,
  delta: number,
  grinderClicks: number
): number {
  return Math.min(grinderClicks, Math.max(1, currentClick + delta));
}
