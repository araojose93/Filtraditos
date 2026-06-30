// Lógica pura de fichas de café (H6). Sin storage, sin DOM: recibe los datos
// como parámetro (un array) y devuelve un resultado. Así es testeable sin
// mocks, como el resto del engine. La persistencia vive en
// src/ui/coffeeBagsStore.ts.

import type { CoffeeBag } from "./types";

/** Forma mínima de una cata que getBestEntryForBag necesita leer. */
export interface BagLinkedEntry {
  id: number;
  date: string; // ISO — desempata "más reciente"
  rating: number; // 1-5
  coffeeBagId?: string;
}

/**
 * Filtra fichas cuyo name o brand contengan `query` (case-insensitive,
 * substring). Query vacía → todas. Ej.: "nakama" encuentra "Geisha Lavado"
 * de "Nakama Café".
 */
export function searchCoffeeBags(bags: CoffeeBag[], query: string): CoffeeBag[] {
  const q = query.trim().toLowerCase();
  if (!q) return bags;
  return bags.filter(
    (b) =>
      b.name.toLowerCase().includes(q) || b.brand.toLowerCase().includes(q)
  );
}

/**
 * La preparación favorita de una ficha entre sus catas vinculadas:
 *   1. Si la ficha tiene `favoriteEntryId` y esa cata existe → esa (gana sobre
 *      el rating, es una elección explícita del usuario).
 *   2. Si no → mayor rating; empate → la más reciente (por `date`).
 *   3. Sin catas vinculadas → undefined.
 * Genérico para no acoplar el engine al tipo JournalEntry de la UI.
 */
export function getBestEntryForBag<T extends BagLinkedEntry>(
  bag: CoffeeBag,
  journalEntries: T[]
): T | undefined {
  const linked = journalEntries.filter((e) => e.coffeeBagId === bag.id);
  if (linked.length === 0) return undefined;

  if (bag.favoriteEntryId) {
    const marked = linked.find((e) => String(e.id) === bag.favoriteEntryId);
    if (marked) return marked; // la marcada gana, ignora rating
  }

  return linked.reduce((best, e) => {
    if (e.rating > best.rating) return e;
    if (e.rating === best.rating && e.date > best.date) return e;
    return best;
  });
}
