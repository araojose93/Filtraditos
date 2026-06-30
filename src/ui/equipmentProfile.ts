// Persistencia del perfil de molino (H3). Es el puente entre la pantalla de
// Perfil (que lo escribe) y SETUP/PREP (que lo leen para getGrindClick). El
// legacy solo guardaba grinderClicks; aquí derivamos baseClick = punto medio
// del rango, porque el engine razona como baseClick + offset de la receta.

import type { EquipmentProfile } from "../engine/types";

const STORAGE_KEY = "brewlab:equipmentProfile";

export const DEFAULT_CLICKS = 6;
export const MIN_CLICKS = 1;
export const MAX_CLICKS = 12;

/** Clic base por defecto = punto medio del molino (N=6 → 3). */
export function midpointClick(grinderClicks: number): number {
  return clamp(Math.round(grinderClicks / 2), 1, grinderClicks);
}

/** Construye un perfil válido a partir del total de clics. */
export function makeProfile(grinderClicks: number): EquipmentProfile {
  const clicks = clamp(Math.round(grinderClicks), MIN_CLICKS, MAX_CLICKS);
  return { grinderClicks: clicks, baseClick: midpointClick(clicks) };
}

/** Perfil guardado, o el default si no hay nada (o el dato está corrupto). */
export function loadProfile(): EquipmentProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<EquipmentProfile>;
      if (
        typeof p?.grinderClicks === "number" &&
        typeof p?.baseClick === "number"
      ) {
        return { grinderClicks: p.grinderClicks, baseClick: p.baseClick };
      }
    }
  } catch {
    // localStorage no disponible o JSON inválido → default
  }
  return makeProfile(DEFAULT_CLICKS);
}

/** Persiste el perfil en localStorage. */
export function saveProfile(profile: EquipmentProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // sin almacenamiento: el perfil vive solo en esta sesión
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
