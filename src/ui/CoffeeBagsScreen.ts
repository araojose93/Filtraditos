// Pantalla de Fichas de café (H6). Lista + búsqueda en vivo, detalle con la
// "preparación favorita" (getBestEntryForBag) y sus catas vinculadas, y alta
// de fichas nuevas. Solo lee/escribe vía el engine (coffeeBags) y la bitácora;
// no calcula nada de café por su cuenta.

import { searchCoffeeBags, getBestEntryForBag } from "../engine/coffeeBags";
import type { CoffeeBag } from "../engine/types";
import { loadCoffeeBags, saveCoffeeBag } from "./coffeeBagsStore";
import { loadJournal, type JournalEntry } from "./journal";
import { entryCardHtml, escapeHtml } from "./JournalScreen";

export interface CoffeeBagsScreenOptions {
  onBack: () => void;
  /** Preparar la receta de la cata favorita (clona receta + dosis, sin ajuste). */
  onPrepareRecipe: (entry: JournalEntry) => void;
}

export class CoffeeBagsScreen {
  readonly el: HTMLElement;
  private query = "";

  constructor(private opts: CoffeeBagsScreenOptions) {
    this.el = document.createElement("section");
    this.el.className = "screen";
    this.showList();
  }

  // ── LISTA + búsqueda ───────────────────────────────────

  private showList(): void {
    this.el.innerHTML = `
      <div class="brand">
        <div class="dot"></div>
        <h1>Mis cafés</h1>
        <button class="x" id="back" aria-label="Volver" style="margin-left:auto">✕</button>
      </div>

      <div class="field">
        <input id="search" placeholder="Buscar por nombre o marca…" autocomplete="off" value="${escapeHtml(this.query)}">
      </div>

      <button class="btn ghost" id="newBag" style="margin-bottom:16px">+ Nueva ficha</button>

      <div id="bagList"></div>
    `;

    const search = this.q<HTMLInputElement>("search");
    search.addEventListener("input", () => {
      this.query = search.value;
      this.renderBagList();
    });
    this.q("back").addEventListener("click", () => this.opts.onBack());
    this.q("newBag").addEventListener("click", () => this.showForm());

    this.renderBagList();
  }

  private renderBagList(): void {
    const list = this.q("bagList");
    const all = loadCoffeeBags();
    const bags = searchCoffeeBags(all, this.query);

    if (all.length === 0) {
      list.innerHTML = `<div class="empty"><p>Aún no tienes fichas.<br>Crea una con <b>+ Nueva ficha</b>.</p></div>`;
      return;
    }
    if (bags.length === 0) {
      list.innerHTML = `<div class="empty"><p>Sin resultados para "${escapeHtml(this.query.trim())}".</p></div>`;
      return;
    }

    list.innerHTML = bags
      .map(
        (b) => `
        <div class="bagrow" data-id="${b.id}">
          <div class="bn">${escapeHtml(b.name)}</div>
          <div class="bb">${escapeHtml(b.brand || "—")}</div>
        </div>`
      )
      .join("");

    list.querySelectorAll<HTMLElement>(".bagrow").forEach((row) => {
      row.addEventListener("click", () => this.showDetail(row.dataset.id!));
    });
  }

  // ── DETALLE de una ficha ───────────────────────────────

  private showDetail(bagId: string): void {
    const bag = loadCoffeeBags().find((b) => b.id === bagId);
    if (!bag) {
      this.showList();
      return;
    }

    const entries = loadJournal();
    const linked = entries.filter((e) => e.coffeeBagId === bag.id);
    const best = getBestEntryForBag(bag, entries);

    const datos = [
      bag.origin ? `<span>📍 ${escapeHtml(bag.origin)}</span>` : "",
      bag.roastLevel ? `<span>🔥 ${escapeHtml(bag.roastLevel)}</span>` : "",
      bag.roastDate ? `<span>📅 ${escapeHtml(bag.roastDate)}</span>` : "",
    ]
      .filter(Boolean)
      .join("");

    const fav = best
      ? `<div class="fav">
           <div class="favlbl">Tu preparación favorita</div>
           <div class="favsum">${escapeHtml(best.recipe)}, ratio 1:${(
          best.water / best.coffee
        ).toFixed(1)}, ${escapeHtml(best.grind || "—")} — ${starsInline(best.rating)}</div>
           <button class="btn ghost" id="prepRecipe" style="margin-top:12px">Preparar esta receta</button>
         </div>`
      : `<div class="fav">
           <div class="favsum">Aún no tienes catas con este café.</div>
           <button class="btn ghost" id="prepBag" style="margin-top:12px">Preparar este café</button>
         </div>`;

    const linkedList = linked.length
      ? linked
          .map((en) =>
            entryCardHtml(en, {
              withFavorite: true,
              currentFavoriteId: bag.favoriteEntryId,
            })
          )
          .join("")
      : "";

    this.el.innerHTML = `
      <div class="brand">
        <div class="dot"></div>
        <h1>${escapeHtml(bag.name)}</h1>
        <button class="x" id="detailBack" aria-label="Volver" style="margin-left:auto">‹</button>
      </div>

      <div class="eyebrow">${escapeHtml(bag.brand || "Sin marca")}</div>
      ${datos ? `<div class="bagmeta">${datos}</div>` : ""}

      ${fav}

      ${linked.length ? `<div class="eyebrow">Catas con este café (${linked.length})</div>` : ""}
      ${linkedList}
    `;

    this.q("detailBack").addEventListener("click", () => this.showList());

    // Sin favorita: "Preparar este café" vuelve a SETUP (no hay receta concreta).
    const prep = this.el.querySelector<HTMLElement>("#prepBag");
    if (prep) prep.addEventListener("click", () => this.opts.onBack());

    // Con favorita: "Preparar esta receta" clona receta + dosis de la mejor cata.
    const prepRecipe = this.el.querySelector<HTMLElement>("#prepRecipe");
    if (prepRecipe && best) {
      prepRecipe.addEventListener("click", () => this.opts.onPrepareRecipe(best));
    }

    // Marcar una cata vinculada como favorita de la ficha.
    this.el.querySelectorAll<HTMLElement>(".markfav").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const fresh = loadCoffeeBags().find((b) => b.id === bag.id);
        if (!fresh) return;
        fresh.favoriteEntryId = String(id);
        saveCoffeeBag(fresh);
        this.showDetail(bag.id); // refresca; el bloque favorita se actualiza
      });
    });
  }

  // ── FORMULARIO de alta ─────────────────────────────────

  private showForm(): void {
    this.el.innerHTML = `
      <div class="brand">
        <div class="dot"></div>
        <h1>Nueva ficha</h1>
        <button class="x" id="formBack" aria-label="Volver" style="margin-left:auto">✕</button>
      </div>

      <div class="field"><label>Nombre del café</label><input id="fName" placeholder="ej. Geisha Lavado"></div>
      <div class="field"><label>Marca / tostador</label><input id="fBrand" placeholder="ej. Nakama Café"></div>
      <div class="field"><label>Origen</label><input id="fOrigin" placeholder="ej. Tolima, Colombia"></div>
      <div class="field"><label>Tueste</label><input id="fRoast" placeholder="ej. claro, medio, oscuro"></div>
      <div class="field"><label>Fecha de tueste</label><input id="fDate" type="date"></div>

      <div class="spacer"></div>

      <div class="btn-row">
        <button class="btn ghost" id="formCancel">Cancelar</button>
        <button class="btn primary" id="formSave">Guardar ficha</button>
      </div>
    `;

    this.q("formBack").addEventListener("click", () => this.showList());
    this.q("formCancel").addEventListener("click", () => this.showList());
    this.q("formSave").addEventListener("click", () => {
      const name = this.q<HTMLInputElement>("fName").value.trim();
      if (!name) {
        this.q<HTMLInputElement>("fName").focus();
        return;
      }
      const bag: CoffeeBag = {
        id: "bag-" + Date.now(),
        name,
        brand: this.q<HTMLInputElement>("fBrand").value.trim(),
      };
      const origin = this.q<HTMLInputElement>("fOrigin").value.trim();
      const roastLevel = this.q<HTMLInputElement>("fRoast").value.trim();
      const roastDate = this.q<HTMLInputElement>("fDate").value;
      if (origin) bag.origin = origin;
      if (roastLevel) bag.roastLevel = roastLevel;
      if (roastDate) bag.roastDate = roastDate;

      saveCoffeeBag(bag);
      this.query = "";
      this.showList();
    });
  }

  private q<T extends HTMLElement = HTMLElement>(id: string): T {
    const el = this.el.querySelector<T>(`#${id}`);
    if (!el) throw new Error(`Falta #${id} en CoffeeBagsScreen`);
    return el;
  }
}

/** Estrellas inline (rellenas en ámbar, vacías en tenue). */
function starsInline(rating: number): string {
  if (!rating) return "";
  return (
    `<span style="color:var(--amber)">${"★".repeat(rating)}</span>` +
    `<span style="color:var(--faint)">${"★".repeat(5 - rating)}</span>`
  );
}
