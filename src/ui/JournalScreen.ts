// Pantalla de Bitácora (H5, port de s-journal). Lista de catas guardadas con
// estrellas, meta, sabores y notas. Cada entrada se puede eliminar. Solo lee/
// borra de journal.ts; no calcula nada de café.

import { loadJournal, deleteEntry, type JournalEntry } from "./journal";

export interface JournalScreenOptions {
  onBack: () => void;
  /** Repetir un brew clonando la entrada (con ajuste de molienda si la hay). */
  onRepeat: (entry: JournalEntry) => void;
}

export class JournalScreen {
  readonly el: HTMLElement;
  private listEl!: HTMLElement;
  private countEl!: HTMLElement;

  constructor(private opts: JournalScreenOptions) {
    this.el = document.createElement("section");
    this.el.className = "screen";
    this.build();
  }

  private build(): void {
    this.el.innerHTML = `
      <div class="brand">
        <div class="dot"></div>
        <h1>Bitácora</h1>
        <span class="tag" id="jCount">0 catas</span>
        <button class="x" id="journalBack" aria-label="Volver" style="margin-left:12px">✕</button>
      </div>
      <div id="journalList"></div>
    `;

    this.countEl = this.q("jCount");
    this.listEl = this.q("journalList");
    this.q("journalBack").addEventListener("click", () => this.opts.onBack());

    this.renderList(loadJournal());
  }

  private renderList(list: JournalEntry[]): void {
    this.countEl.textContent = `${list.length} ${list.length === 1 ? "cata" : "catas"}`;

    if (list.length === 0) {
      this.listEl.innerHTML = `
        <div class="empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h13a2 2 0 012 2v14H6a2 2 0 01-2-2zM4 4v16"/></svg>
          <p>Aún no hay catas.<br>Prepara un café y guárdalo aquí.</p>
        </div>`;
      return;
    }

    this.listEl.innerHTML = list
      .map((en) => entryCardHtml(en, { withDelete: true, withRepeat: true }))
      .join("");

    this.listEl.querySelectorAll<HTMLElement>(".del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        this.renderList(deleteEntry(id));
      });
    });

    this.listEl.querySelectorAll<HTMLElement>(".repeat").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const entry = list.find((e) => e.id === id);
        if (entry) this.opts.onRepeat(entry);
      });
    });
  }

  private q(id: string): HTMLElement {
    const el = this.el.querySelector<HTMLElement>(`#${id}`);
    if (!el) throw new Error(`Falta #${id} en JournalScreen`);
    return el;
  }
}

/**
 * HTML de una tarjeta de cata (reusada por la Bitácora y por el detalle de
 * ficha de café). `withDelete` agrega el botón eliminar (el caller cablea el
 * handler buscando `.del`).
 */
export function entryCardHtml(
  en: JournalEntry,
  opts: {
    withDelete?: boolean;
    withRepeat?: boolean;
    withFavorite?: boolean;
    currentFavoriteId?: string;
  } = {}
): string {
  const d = new Date(en.date);
  const fecha =
    d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });

  const stars = en.rating
    ? "★".repeat(en.rating) +
      `<span style="color:var(--faint)">${"★".repeat(5 - en.rating)}</span>`
    : "";

  const meta = [
    `<span>${en.coffee} g café</span>`,
    `<span>${en.water} g agua</span>`,
    en.time ? `<span>${en.time}</span>` : "",
    en.grind ? `<span>⚙ ${escapeHtml(en.grind)}</span>` : "",
  ].join("");

  const tastes = en.tastes.length
    ? `<div class="etastes">${en.tastes
        .map((t) => `<span class="etag">${escapeHtml(t)}</span>`)
        .join("")}</div>`
    : "";

  const notes = en.notes
    ? `<div class="enote">"${escapeHtml(en.notes)}"</div>`
    : "";

  const sugg = en.suggestion
    ? `<div class="esugg">💡 ${escapeHtml(en.suggestion.reason)}</div>`
    : "";

  const adjust =
    en.suggestion?.direction === "mas_fino" ||
    en.suggestion?.direction === "mas_grueso";
  const repeat = opts.withRepeat
    ? `<button class="repeat" data-id="${en.id}">↻ ${adjust ? "Repetir con ajuste" : "Repetir"}</button>`
    : "";
  const fav = opts.withFavorite
    ? String(en.id) === opts.currentFavoriteId
      ? `<span class="favmark">★ Favorita</span>`
      : `<button class="markfav" data-id="${en.id}">★ Marcar como favorita</button>`
    : "";
  const del = opts.withDelete
    ? `<button class="del" data-id="${en.id}">eliminar</button>`
    : "";
  const actions =
    repeat || fav || del
      ? `<div class="eactions">${repeat}${fav}${del}</div>`
      : "";

  return `
    <div class="entry">
      <div class="eh">
        <div>
          <div class="en">${escapeHtml(en.recipe)}</div>
          <div class="ed">${fecha}</div>
        </div>
        <div class="er">${stars}</div>
      </div>
      <div class="emeta">${meta}</div>
      ${tastes}
      ${notes}
      ${sugg}
      ${actions}
    </div>`;
}

/** Escapa texto del usuario antes de meterlo como HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
