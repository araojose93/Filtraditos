// Pantalla SETUP — portada del s-home del prototipo legacy (brand, coach
// explainer, tarjetas de receta, stepper de dosis, summary). El copy de las
// tarjetas (autor/descripción) se porta tal cual del prototipo: es contenido
// de presentación, no lógica. El agua total sale del engine, no de aquí.

import { buildRecipe, type RecipeId } from "../engine/recipes";
import { getBrewState } from "../engine/brewEngine";
import { recipeTotalDuration, formatClock } from "./BrewScreen";

const DOSE_MIN = 10;
const DOSE_MAX = 30;
const DOSE_DEFAULT = 15;

/** Orden de presentación de las recetas. */
const RECIPE_ORDER: RecipeId[] = ["v60-facil", "hoffmann", "tetsu-46"];

/** Copy de presentación de cada receta (portado del prototipo). */
export const RECIPE_META: Record<
  RecipeId,
  { author: string; desc: string; grind: string }
> = {
  "v60-facil": {
    author: "para empezar",
    desc: "Tres vertidos, perdona errores. Ideal mientras agarras pulso con la jarra.",
    grind: "medio-grueso",
  },
  hoffmann: {
    author: "adaptación · 1 taza",
    desc: "Bloom largo + dos vertidos + swirl. Claridad y dulzor. La favorita de muchos.",
    grind: "medio",
  },
  "tetsu-46": {
    author: "adaptación",
    desc: "5 vertidos cada 45 s. Los 2 primeros mueven dulzor/acidez, los 3 últimos el cuerpo.",
    grind: "medio-grueso",
  },
};

export interface RecipeSelectorOptions {
  onStart: (recipeId: RecipeId, doseGrams: number) => void;
  /** Navega a la pestaña de Agua (temperatura). */
  onWater: () => void;
}

export class RecipeSelector {
  readonly el: HTMLElement;

  private recipeId: RecipeId = "v60-facil";
  private dose = DOSE_DEFAULT;

  constructor(private opts: RecipeSelectorOptions) {
    this.el = document.createElement("section");
    this.el.className = "screen";
    this.render();
  }

  /** Agua total estimada para la dosis actual, según el engine. */
  private totalWater(): number {
    const recipe = buildRecipe(this.recipeId, this.dose);
    return getBrewState(recipe, this.dose, 0).totalWater;
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="brand">
        <div class="dot"></div>
        <h1>Brew<b>Lab</b></h1>
        <span class="tag">V60</span>
        <button class="watertab" id="waterTab">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3s6 7 6 11a6 6 0 01-12 0c0-4 6-11 6-11z"/></svg>
          Agua
        </button>
      </div>

      <div class="eyebrow">Tu laboratorio</div>
      <h2>¿Qué preparamos hoy?</h2>
      <p class="sub">Elige receta, ajusta la dosis y deja que el reloj te guíe vertido a vertido.</p>

      <div class="gear">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e0883c" stroke-width="2"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/></svg>
        <p><b>Coach por ritmo.</b> En cada vertido la pantalla se pone
          <b style="color:var(--water)">azul</b> (vierte) o
          <b style="color:var(--amber)">ámbar</b> (espera). Sigue el ritmo
          objetivo y olvídate de clavar el gramo exacto en tu gramera lenta.</p>
      </div>

      <div class="cards" id="recipeCards"></div>

      <div class="dose">
        <div class="row">
          <label>Dosis de café</label>
          <div class="stepper">
            <button id="doseMinus" aria-label="Menos café">−</button>
            <div class="val"><span id="doseVal">${this.dose}</span><small> g</small></div>
            <button id="dosePlus" aria-label="Más café">+</button>
          </div>
        </div>
        <div class="summary">
          <div class="w">Agua total<b id="sumWater">—</b></div>
          <div>Ratio<b id="sumRatio">—</b></div>
        </div>
      </div>

      <div class="spacer"></div>

      <button class="btn primary" id="startBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Preparar
      </button>
    `;

    this.renderCards();
    this.updateSummary();

    this.byId("doseMinus").addEventListener("click", () => this.changeDose(-1));
    this.byId("dosePlus").addEventListener("click", () => this.changeDose(1));
    this.byId("startBtn").addEventListener("click", () => {
      this.opts.onStart(this.recipeId, this.dose);
    });
    this.byId("waterTab").addEventListener("click", () => this.opts.onWater());
  }

  private renderCards(): void {
    const cards = this.byId("recipeCards");
    cards.innerHTML = RECIPE_ORDER.map((id) => {
      const recipe = buildRecipe(id, this.dose);
      const meta = RECIPE_META[id];
      const sel = id === this.recipeId ? " sel" : "";
      const total = recipeTotalDuration(recipe);
      return `
        <div class="card${sel}" data-id="${id}">
          <div class="rname">${recipe.name}</div>
          <div class="auth">${meta.author}</div>
          <div class="rdesc">${meta.desc}</div>
          <div class="chips">
            <span class="chip w">1:${recipe.ratio}</span>
            <span class="chip">${recipe.steps.length} vertidos</span>
            <span class="chip">${formatClock(total)} aprox</span>
          </div>
        </div>`;
    }).join("");

    cards.querySelectorAll<HTMLElement>(".card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id as RecipeId;
        this.recipeId = id;
        this.renderCards();
        this.updateSummary();
      });
    });
  }

  private changeDose(delta: number): void {
    this.dose = clamp(this.dose + delta, DOSE_MIN, DOSE_MAX);
    this.byId("doseVal").textContent = String(this.dose);
    this.renderCards();
    this.updateSummary();
  }

  private updateSummary(): void {
    const recipe = buildRecipe(this.recipeId, this.dose);
    this.byId("sumWater").textContent = `${Math.round(this.totalWater())} g`;
    this.byId("sumRatio").textContent = `1:${recipe.ratio}`;
  }

  private byId(id: string): HTMLElement {
    const el = this.el.querySelector<HTMLElement>(`#${id}`);
    if (!el) throw new Error(`Falta #${id} en RecipeSelector`);
    return el;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
