// Pantalla de Bitácora (H5, port de s-journal). Lista de catas guardadas con
// estrellas, meta, sabores y notas. Cada entrada se puede eliminar. Solo lee/
// borra de journal.ts; no calcula nada de café.

import { loadJournal, deleteEntry, type JournalEntry } from "./journal";

export interface JournalScreenOptions {
  onBack: () => void;
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

    this.listEl.innerHTML = list.map((en) => this.entryHtml(en)).join("");

    this.listEl.querySelectorAll<HTMLElement>(".del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        this.renderList(deleteEntry(id));
      });
    });
  }

  private entryHtml(en: JournalEntry): string {
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
        <button class="del" data-id="${en.id}">eliminar</button>
      </div>`;
  }

  private q(id: string): HTMLElement {
    const el = this.el.querySelector<HTMLElement>(`#${id}`);
    if (!el) throw new Error(`Falta #${id} en JournalScreen`);
    return el;
  }
}

/** Escapa texto del usuario antes de meterlo como HTML. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
