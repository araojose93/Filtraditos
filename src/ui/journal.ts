// Bitácora de catas (H5): persistencia de cada preparación en localStorage.
// Las entradas nuevas van al principio (las más recientes arriba). Es el
// puente entre el formulario de FIN (que escribe) y JournalScreen (que lee).

import type { BrewSuggestion } from "../engine/brewSuggestion";

const STORAGE_KEY = "brewlab:journal";

/** Perfiles de sabor disponibles en el formulario de cata (multi-selección). */
export const TASTE_OPTS = [
  "Ácido",
  "Dulce",
  "Amargo",
  "Afrutado",
  "Floral",
  "Cuerpo",
  "Balanceado",
  "Aguado",
  "Astringente/Seco",
  "Quemado",
] as const;

export interface JournalEntry {
  id: number;
  date: string; // ISO
  recipe: string; // nombre de la receta
  coffee: number; // g de café
  water: number; // g de agua
  time: string; // mm:ss real transcurrido
  rating: number; // 1-5 (0 = sin calificar)
  tastes: string[];
  grind: string;
  notes: string;
  coffeeBagId?: string; // referencia opcional a una CoffeeBag (H6)
  suggestion?: BrewSuggestion; // sugerencia de ajuste al guardar (H7+)
}

/** Lista guardada (más recientes primero), o [] si no hay nada / dato inválido. */
export function loadJournal(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list as JournalEntry[];
    }
  } catch {
    // sin almacenamiento o JSON inválido
  }
  return [];
}

function saveJournal(list: JournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // sin almacenamiento: la cata vive solo en esta sesión
  }
}

/** Inserta una entrada al principio de la bitácora. */
export function addEntry(entry: JournalEntry): void {
  const list = loadJournal();
  list.unshift(entry);
  saveJournal(list);
}

/** Borra una entrada por id y devuelve la lista resultante. */
export function deleteEntry(id: number): JournalEntry[] {
  const list = loadJournal().filter((e) => e.id !== id);
  saveJournal(list);
  return list;
}
