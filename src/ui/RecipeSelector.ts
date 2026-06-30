// Pantalla SETUP — solo la decisión de "qué receta": tarjetas con su historia
// breve y chips (ratio, vertidos, tiempo, molino), más el botón Preparar. La
// dosis y el agua total se ajustan en PREP (siguiente paso), no aquí. El copy
// de las tarjetas es presentación, no lógica — el engine no cambia.

import { buildRecipe, type RecipeId } from "../engine/recipes";
import { getGrindClick } from "../engine/grinder";
import { recipeTotalDuration, formatClock } from "./BrewScreen";
import { loadProfile } from "./equipmentProfile";

/** Orden de presentación de las recetas. */
const RECIPE_ORDER: RecipeId[] = ["v60-facil", "hoffmann", "tetsu-46"];

/**
 * Copy de presentación de cada receta. `desc` es la historia breve (el "por
 * qué"); `grind` es la palabra de molienda usada en el checklist de PREP.
 */
export const RECIPE_META: Record<
  RecipeId,
  { author: string; desc: string; grind: string }
> = {
  "v60-facil": {
    author: "para empezar",
    desc: "La receta sin complicaciones — ideal para empezar o cuando no quieres pensar mucho.",
    grind: "medio-grueso",
  },
  hoffmann: {
    author: "adaptación · 1 taza",
    desc: "La referencia del método V60 — bloom controlado y dos vertidos precisos, pensada para consistencia.",
    grind: "medio",
  },
  "tetsu-46": {
    author: "adaptación",
    desc: "El método de 5 vertidos que separa dulzor (primeros 2) de fuerza (últimos 3) — para ajustar el sabor sin cambiar la molienda.",
    grind: "medio-grueso",
  },
};

export interface RecipeSelectorOptions {
  onStart: (recipeId: RecipeId) => void;
  /** Navega a la pestaña de Agua (temperatura). */
  onWater: () => void;
  /** Navega a la pantalla de Perfil de equipo (molino). */
  onProfile: () => void;
  /** Navega a la pantalla de Bitácora de catas. */
  onJournal: () => void;
  /** Navega a la pantalla de Fichas de café. */
  onCoffeeBags: () => void;
}

export class RecipeSelector {
  readonly el: HTMLElement;

  private recipeId: RecipeId = "v60-facil";

  constructor(private opts: RecipeSelectorOptions) {
    this.el = document.createElement("section");
    this.el.className = "screen";
    this.render();
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="brand">
        <div class="dot"></div>
        <h1>Brew<b>Lab</b></h1>
        <span class="tag">V60</span>
      </div>

      <div class="tabs">
        <button class="equiptab" id="profileTab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
          Mi equipo
        </button>
        <button class="watertab" id="waterTab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z"/></svg>
          Agua
        </button>
        <button class="journaltab" id="journalTab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h13a2 2 0 012 2v14H6a2 2 0 01-2-2zM4 4v16M9 8h7M9 12h7"/></svg>
          Bitácora
        </button>
        <button class="coffeetab" id="coffeeTab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5zM17 9h2a2 2 0 010 4h-2"/></svg>
          Mis cafés
        </button>
      </div>

      <div class="eyebrow">Tu laboratorio</div>
      <h2>¿Qué preparamos hoy?</h2>
      <p class="sub">Elige tu receta. La dosis y el agua las ajustas en el siguiente paso.</p>

      <div class="gear">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e0883c" stroke-width="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/></svg>
        <p><b>Coach por ritmo.</b> En cada vertido la pantalla se pone
          <b style="color:var(--water)">azul</b> (vierte) o
          <b style="color:var(--amber)">ámbar</b> (espera). Sigue el ritmo
          objetivo y olvídate de clavar el gramo exacto en tu gramera lenta.</p>
      </div>

      <div class="cards" id="recipeCards"></div>

      <div class="spacer"></div>

      <button class="btn primary" id="startBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Preparar
      </button>
    `;

    this.renderCards();

    this.byId("startBtn").addEventListener("click", () => {
      this.opts.onStart(this.recipeId);
    });
    this.byId("waterTab").addEventListener("click", () => this.opts.onWater());
    this.byId("profileTab").addEventListener("click", () => this.opts.onProfile());
    this.byId("journalTab").addEventListener("click", () => this.opts.onJournal());
    this.byId("coffeeTab").addEventListener("click", () => this.opts.onCoffeeBags());
  }

  private renderCards(): void {
    // La dosis vive en PREP; aquí solo necesitamos datos que no dependen de
    // ella (nombre, ratio, nº de vertidos, duración, molino del perfil).
    const profile = loadProfile();
    const cards = this.byId("recipeCards");
    cards.innerHTML = RECIPE_ORDER.map((id) => {
      const recipe = buildRecipe(id, 15);
      const meta = RECIPE_META[id];
      const sel = id === this.recipeId ? " sel" : "";
      const total = recipeTotalDuration(recipe);
      const click = getGrindClick(profile, recipe.recommendedClickOffset);
      return `
        <div class="card${sel}" data-id="${id}">
          <div class="rname">${recipe.name}</div>
          <div class="auth">${meta.author}</div>
          <div class="rdesc">${meta.desc}</div>
          <div class="chips">
            <span class="chip w">1:${recipe.ratio}</span>
            <span class="chip">${recipe.steps.length} vertidos</span>
            <span class="chip">${formatClock(total)} aprox</span>
            <span class="chip">clic ${click}</span>
          </div>
        </div>`;
    }).join("");

    cards.querySelectorAll<HTMLElement>(".card").forEach((card) => {
      card.addEventListener("click", () => {
        this.recipeId = card.dataset.id as RecipeId;
        this.renderCards();
      });
    });
  }

  private byId(id: string): HTMLElement {
    const el = this.el.querySelector<HTMLElement>(`#${id}`);
    if (!el) throw new Error(`Falta #${id} en RecipeSelector`);
    return el;
  }
}
