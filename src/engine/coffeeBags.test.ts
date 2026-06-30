import { describe, it, expect } from "vitest";
import type { CoffeeBag } from "./types";
import { searchCoffeeBags, getBestEntryForBag } from "./coffeeBags";

const BAGS: CoffeeBag[] = [
  { id: "b1", name: "Geisha Lavado", brand: "Nakama Café" },
  { id: "b2", name: "Bourbon Rojo", brand: "Cafetal" },
];

interface TestEntry {
  id: number;
  date: string;
  rating: number;
  coffeeBagId?: string;
}

describe("searchCoffeeBags (pura)", () => {
  it("encuentra por marca, case-insensitive y parcial", () => {
    expect(searchCoffeeBags(BAGS, "nakama").map((b) => b.id)).toEqual(["b1"]);
  });

  it("encuentra por nombre, case-insensitive", () => {
    expect(searchCoffeeBags(BAGS, "GEISHA").map((b) => b.id)).toEqual(["b1"]);
    expect(searchCoffeeBags(BAGS, "bourbon").map((b) => b.id)).toEqual(["b2"]);
  });

  it("query vacía devuelve todas", () => {
    expect(searchCoffeeBags(BAGS, "  ").map((b) => b.id)).toEqual(["b1", "b2"]);
  });

  it("sin coincidencias devuelve []", () => {
    expect(searchCoffeeBags(BAGS, "etiopía")).toEqual([]);
  });
});

describe("getBestEntryForBag (pura)", () => {
  it("retorna la cata de mayor rating vinculada a la ficha", () => {
    const entries: TestEntry[] = [
      { id: 1, date: "2026-01-01T10:00:00Z", rating: 3, coffeeBagId: "b1" },
      { id: 2, date: "2026-01-02T10:00:00Z", rating: 5, coffeeBagId: "b1" },
      { id: 3, date: "2026-01-03T10:00:00Z", rating: 4, coffeeBagId: "b1" },
      { id: 4, date: "2026-01-04T10:00:00Z", rating: 5, coffeeBagId: "otra" },
    ];
    expect(getBestEntryForBag("b1", entries)?.id).toBe(2);
  });

  it("con empate de rating retorna la más reciente", () => {
    const entries: TestEntry[] = [
      { id: 1, date: "2026-01-01T10:00:00Z", rating: 5, coffeeBagId: "b1" },
      { id: 2, date: "2026-03-01T10:00:00Z", rating: 5, coffeeBagId: "b1" },
    ];
    expect(getBestEntryForBag("b1", entries)?.id).toBe(2);
  });

  it("sin catas vinculadas retorna undefined", () => {
    const entries: TestEntry[] = [
      { id: 1, date: "2026-01-01T10:00:00Z", rating: 5, coffeeBagId: "otra" },
      { id: 2, date: "2026-01-02T10:00:00Z", rating: 4 },
    ];
    expect(getBestEntryForBag("b1", entries)).toBeUndefined();
  });
});
