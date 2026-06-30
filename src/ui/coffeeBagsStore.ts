// Persistencia de fichas de café (H6) en localStorage. Vive en src/ui como
// journal.ts: el engine es puro y no toca storage. La lógica pura (buscar,
// calcular favorita) está en src/engine/coffeeBags.ts y recibe estos datos
// como parámetro.

import type { CoffeeBag } from "../engine/types";

const STORAGE_KEY = "brewlab:coffeeBags";

/** Todas las fichas guardadas (las más recientes primero), o [] si no hay. */
export function loadCoffeeBags(): CoffeeBag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list as CoffeeBag[];
    }
  } catch {
    // sin almacenamiento o JSON inválido
  }
  return [];
}

function persist(list: CoffeeBag[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // sin almacenamiento: la ficha vive solo en esta sesión
  }
}

/** Inserta una ficha nueva o actualiza la existente con el mismo id. */
export function saveCoffeeBag(bag: CoffeeBag): void {
  const list = loadCoffeeBags();
  const i = list.findIndex((b) => b.id === bag.id);
  if (i >= 0) list[i] = bag;
  else list.unshift(bag);
  persist(list);
}
