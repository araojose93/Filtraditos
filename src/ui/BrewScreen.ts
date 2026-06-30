// Pantalla principal. Orquesta SETUP (RecipeSelector) → PREP (checklist) →
// BREWING, portando el diseño del prototipo (s-prep, s-brew). El ÚNICO uso de
// Date.now() de la app vive aquí: la UI lee el reloj real, calcula los segundos
// y se los pasa al engine puro. La UI nunca decide vierte/espera — solo pinta
// lo que getBrewState() devuelve.
//
// El estado FIN es decisión de UI, no del engine: se alcanza pulsando "Terminé
// el vertido" en el último paso. El engine no puede saber cuándo terminó el
// drawdown real (depende de molienda/dosis/tueste), así que lo decide el
// usuario.

import { buildRecipe, type RecipeId } from "../engine/recipes";
import { getBrewState, type BrewState } from "../engine/brewEngine";
import { getGrindClick } from "../engine/grinder";
import type { Recipe } from "../engine/types";
import { RecipeSelector, RECIPE_META } from "./RecipeSelector";
import { WaterScreen } from "./WaterScreen";
import { ProfileScreen } from "./ProfileScreen";
import { JournalScreen, escapeHtml } from "./JournalScreen";
import { CoffeeBagsScreen } from "./CoffeeBagsScreen";
import { loadProfile } from "./equipmentProfile";
import { addEntry, TASTE_OPTS, type JournalEntry } from "./journal";
import { searchCoffeeBags } from "../engine/coffeeBags";
import { loadCoffeeBags, saveCoffeeBag } from "./coffeeBagsStore";

/** Cada cuánto refrescamos la vista (ms). El reloj real es Date.now(). */
const TICK_MS = 250;
/** Radio del anillo (coincide con el SVG) y su circunferencia. */
const RING_R = 124;
const RING_CIRC = 2 * Math.PI * RING_R;

type Mode =
  | "setup"
  | "prep"
  | "brewing"
  | "water"
  | "profile"
  | "journal"
  | "coffeebags";

interface BrewRefs {
  live: HTMLElement;
  doneBlock: HTMLElement;
  ringFg: SVGCircleElement;
  modeWord: HTMLElement;
  bigTime: HTMLElement;
  nextIn: HTMLElement;
  paceFalta: HTMLElement;
  paceGhost: HTMLElement;
  paceTarget: HTMLElement;
  paceRate: HTMLElement;
  paceFill: HTMLElement;
  waitMsg: HTMLElement;
  waitLeft: HTMLElement;
  waitDesc: HTMLElement;
  instrTitle: HTMLElement;
  instrText: HTMLElement;
  upNext: HTMLElement;
  finishWrap: HTMLElement;
  doneCoffee: HTMLElement;
  doneWater: HTMLElement;
  doneTime: HTMLElement;
  starsF: HTMLElement;
  tastesF: HTMLElement;
  grindF: HTMLInputElement;
  notesF: HTMLTextAreaElement;
  bagF: HTMLInputElement;
  bagSuggest: HTMLElement;
  discardBtn: HTMLElement;
  saveEntryBtn: HTMLElement;
}

export class BrewScreen {
  private mode: Mode = "setup";
  private recipe: Recipe | null = null;
  private dose = 0;

  private startTime = 0;
  private finishElapsed = 0;
  private finished = false;
  private manualRequested = false;

  // Estado del formulario de cata (FIN).
  private rating = 0;
  private tastes = new Set<string>();
  private selectedBagId: string | null = null; // ficha existente elegida
  private pendingBagName: string | null = null; // ficha nueva a crear al guardar

  private timer: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private refs: BrewRefs | null = null;

  constructor(private root: HTMLElement) {
    this.showSetup();
  }

  // ── SETUP ──────────────────────────────────────────────

  private showSetup(): void {
    this.mode = "setup";
    document.body.classList.remove("brew-pour", "brew-wait");
    const selector = new RecipeSelector({
      onStart: (recipeId) => this.showPrep(recipeId),
      onWater: () => this.showWater(),
      onProfile: () => this.showProfile(),
      onJournal: () => this.showJournal(),
      onCoffeeBags: () => this.showCoffeeBags(),
    });
    this.mount(selector.el);
  }

  // ── BITÁCORA (catas) ───────────────────────────────────

  private showJournal(): void {
    this.mode = "journal";
    document.body.classList.remove("brew-pour", "brew-wait");
    const journal = new JournalScreen({ onBack: () => this.showSetup() });
    this.mount(journal.el);
  }

  // ── FICHAS DE CAFÉ (H6) ────────────────────────────────

  private showCoffeeBags(): void {
    this.mode = "coffeebags";
    document.body.classList.remove("brew-pour", "brew-wait");
    const bags = new CoffeeBagsScreen({ onBack: () => this.showSetup() });
    this.mount(bags.el);
  }

  // ── AGUA (temperatura en vivo) ─────────────────────────

  private showWater(): void {
    this.mode = "water";
    document.body.classList.remove("brew-pour", "brew-wait");
    const water = new WaterScreen({ onBack: () => this.showSetup() });
    this.mount(water.el);
  }

  // ── PERFIL (molino por clics) ──────────────────────────

  private showProfile(): void {
    this.mode = "profile";
    document.body.classList.remove("brew-pour", "brew-wait");
    const profile = new ProfileScreen({ onBack: () => this.showSetup() });
    this.mount(profile.el);
  }

  // ── PREP (dosis + checklist "Monta el setup", port de s-prep) ──

  private showPrep(recipeId: RecipeId): void {
    this.mode = "prep";
    document.body.classList.remove("brew-pour", "brew-wait");

    const DOSE_MIN = 10;
    const DOSE_MAX = 30;
    let dose = 15;
    const recipe = buildRecipe(recipeId, dose); // para el nombre/ratio fijos

    const section = document.createElement("section");
    section.className = "screen";
    section.innerHTML = `
      <div class="brewtop">
        <div class="rn">${recipe.name}</div>
        <button class="x" id="prepBack" aria-label="Volver">✕</button>
      </div>
      <div class="eyebrow">Antes de empezar</div>
      <h2>Monta el setup</h2>

      <div class="dose">
        <div class="row">
          <label>Dosis de café</label>
          <div class="stepper">
            <button id="doseMinus" aria-label="Menos café">−</button>
            <div class="val"><span id="doseVal">${dose}</span><small> g</small></div>
            <button id="dosePlus" aria-label="Más café">+</button>
          </div>
        </div>
        <div class="summary">
          <div class="w">Agua total<b id="sumWater">—</b></div>
          <div>Ratio<b id="sumRatio">1:${recipe.ratio}</b></div>
        </div>
      </div>

      <ol class="prep-list" id="prepList"></ol>

      <div class="spacer"></div>
      <button class="btn primary" id="startTimerBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
        Iniciar cronómetro
      </button>
      <p class="sub" style="text-align:center;margin-top:14px;font-size:12px">El reloj arranca con el bloom. La pantalla queda encendida todo el brew.</p>
    `;

    const q = (id: string) => section.querySelector<HTMLElement>(`#${id}`)!;

    // Recalcula agua total y checklist en vivo según la dosis actual.
    const update = (): void => {
      const r = buildRecipe(recipeId, dose);
      const profile = loadProfile();
      const click = getGrindClick(profile, r.recommendedClickOffset);
      const grind = RECIPE_META[recipeId].grind;
      q("sumWater").textContent = `${Math.round(getBrewState(r, dose, 0).totalWater)} g`;

      const steps = [
        `Muele <b>${dose} g</b> en <b>clic ~${click} de ${profile.grinderClicks}</b> (${grind}).`,
        `Pon el filtro en la V60.`,
        `Pasa el agua a la <b>gooseneck</b>.`,
        `<b>Enjuaga el filtro</b> con agua caliente (quita el sabor a papel y calienta la V60).`,
        `Echa el café, haz un huequito, pon la V60 sobre la jarra y <b>tara a 0</b>.`,
      ];
      q("prepList").innerHTML = steps
        .map((s, i) => `<li><span class="n">${i + 1}</span><span>${s}</span></li>`)
        .join("");
    };

    const setDose = (d: number): void => {
      dose = clamp(d, DOSE_MIN, DOSE_MAX);
      q("doseVal").textContent = String(dose);
      update();
    };

    q("doseMinus").addEventListener("click", () => setDose(dose - 1));
    q("dosePlus").addEventListener("click", () => setDose(dose + 1));
    q("prepBack").addEventListener("click", () => this.showSetup());
    q("startTimerBtn").addEventListener("click", () => this.startBrew(recipeId, dose));

    update();
    this.mount(section);
  }

  // ── BREWING ────────────────────────────────────────────

  private startBrew(recipeId: RecipeId, doseGrams: number): void {
    this.mode = "brewing";
    this.recipe = buildRecipe(recipeId, doseGrams);
    this.dose = doseGrams;
    this.startTime = Date.now();
    this.finished = false;
    this.manualRequested = false;
    this.rating = 0;
    this.tastes.clear();
    this.selectedBagId = null;
    this.pendingBagName = null;

    this.mount(this.buildBrewingDom(this.recipe));
    void this.requestWakeLock();

    this.tick(); // pinta inmediato en t≈0
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  private tick(): void {
    if (this.mode !== "brewing" || !this.recipe || !this.refs) return;

    const live = (Date.now() - this.startTime) / 1000;
    const elapsed = this.finished ? this.finishElapsed : live;
    const state = getBrewState(this.recipe, this.dose, elapsed);

    // FIN solo por decisión del usuario ("Terminé el vertido"). El engine no
    // dispara el final: el drawdown real lo decide quien prepara.
    if (!this.finished && this.manualRequested) {
      this.finished = true;
      this.finishElapsed = elapsed;
      this.stopTimer();
      void this.releaseWakeLock();
      document.body.classList.remove("brew-pour", "brew-wait");
    }

    this.renderBrewing(state, this.finished);
  }

  private renderBrewing(state: BrewState, done: boolean): void {
    const refs = this.refs!;
    const recipe = this.recipe!;
    const steps = recipe.steps;
    const next = steps[state.stepIndex + 1];

    if (done) {
      refs.live.classList.add("hide");
      refs.finishWrap.classList.add("hide");
      refs.doneBlock.classList.remove("hide");
      refs.doneCoffee.textContent = String(this.dose);
      refs.doneWater.textContent = String(Math.round(state.totalWater));
      refs.doneTime.textContent = formatClock(this.finishElapsed);
      return;
    }

    // Fondo "mood" según fase (los gradientes hacen el trabajo visual).
    document.body.classList.toggle("brew-pour", state.phase === "vierte");
    document.body.classList.toggle("brew-wait", state.phase === "espera");

    // "Terminé el vertido" SOLO en el último paso de la receta.
    const onLastStep = state.stepIndex === steps.length - 1;
    refs.finishWrap.classList.toggle("hide", !onLastStep);

    refs.modeWord.textContent = state.phase === "vierte" ? "Vierte" : "Espera";
    refs.bigTime.textContent = formatClock(state.elapsedSeconds);

    const total = recipeTotalDuration(recipe);
    const ringProgress = Math.min(1, state.elapsedSeconds / total);
    refs.ringFg.style.strokeDashoffset = String(RING_CIRC * (1 - ringProgress));

    const secsToNext = next
      ? Math.ceil(Math.max(0, next.startAt - state.elapsedSeconds))
      : 0;
    refs.nextIn.innerHTML = next ? `faltan <b>${secsToNext}s</b>` : "colando…";

    // Coach de ritmo (visible solo en "vierte" por CSS).
    const target = Math.round(state.targetWaterSoFar);
    const prevWater = state.targetWaterSoFar - state.currentPourWater;
    const pourDur = state.step.pourDuration;
    const segProg = clamp(
      (state.elapsedSeconds - state.step.startAt) / pourDur,
      0,
      1
    );
    const ghost = Math.round(prevWater + state.currentPourWater * segProg);
    const falta = Math.max(0, target - ghost);
    const rate = state.currentPourWater / pourDur;
    refs.paceFalta.textContent = `+${falta}`;
    refs.paceGhost.textContent = `≈${ghost} g`;
    refs.paceTarget.textContent = `${target} g`;
    refs.paceRate.textContent = rate.toFixed(1);
    refs.paceFill.style.width = `${target > 0 ? Math.min(100, (ghost / target) * 100) : 0}%`;

    // Panel de espera (visible solo en "espera" por CSS).
    refs.waitMsg.textContent = `${state.step.label ?? "Paso"} · sostén`;
    refs.waitDesc.innerHTML = `Ya vertiste hasta <b>${target} g</b>. Deja que baje el agua.`;
    refs.waitLeft.textContent = next ? `${secsToNext}s` : "colando…";

    // Instrucción + qué sigue.
    refs.instrTitle.textContent = state.step.label ?? `Paso ${state.stepIndex + 1}`;
    refs.instrText.innerHTML =
      state.phase === "vierte"
        ? `Vierte hasta <b>${target} g</b> en espiral, sin tocar las paredes.`
        : `Sostén. Deja que el agua baje antes del siguiente vertido.`;
    refs.upNext.innerHTML = next
      ? `sigue: <b>${next.label ?? "vertido"}</b> en ${formatClock(next.startAt)}`
      : "último paso · deja colar";
  }

  private cancelBrew(): void {
    this.stopTimer();
    void this.releaseWakeLock();
    this.recipe = null;
    this.refs = null;
    this.showSetup();
  }

  private buildBrewingDom(recipe: Recipe): HTMLElement {
    const section = document.createElement("section");
    section.className = "screen";
    section.innerHTML = `
      <div class="brewtop">
        <div class="rn">${recipe.name}</div>
        <button class="x" id="cancelBtn" aria-label="Cancelar">✕</button>
      </div>

      <div id="liveWrap">
        <div class="ringwrap">
          <svg viewBox="0 0 280 280" width="280" height="280">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0a85c"/><stop offset="1" stop-color="#e8654a"/></linearGradient>
              <linearGradient id="gw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a7d0e0"/><stop offset="1" stop-color="#7fb0c4"/></linearGradient>
            </defs>
            <circle class="ring-bg" cx="140" cy="140" r="124" fill="none" stroke-width="12"/>
            <circle class="ring-fg" id="ringFg" cx="140" cy="140" r="124" fill="none" stroke-width="12" stroke-dasharray="${RING_CIRC.toFixed(0)}" stroke-dashoffset="${RING_CIRC.toFixed(0)}"/>
          </svg>
          <div class="ring-center">
            <div class="modechip"><span class="pulse"></span><span id="modeWord">Espera</span></div>
            <div class="bigtime" id="bigTime">0:00</div>
            <div class="next-in" id="nextIn">faltan <b>0s</b></div>
          </div>
        </div>

        <div class="pace-panel">
          <div class="pace-hero"><span class="big" id="paceFalta">+0</span><span class="lbl">g por verter</span></div>
          <div class="pace-meta">
            <span>ve por <b id="paceGhost">≈0 g</b></span>
            <span>meta <b id="paceTarget">0 g</b></span>
            <span class="rate">ritmo <b id="paceRate">0</b> g/s</span>
          </div>
          <div class="track"><div class="fill" id="paceFill"></div></div>
          <div class="pace-tip">Mantén tu balanza cerca de "ve por". Sin prisa, en espiral.</div>
        </div>

        <div class="wait-panel">
          <div class="wm" id="waitMsg">Espera</div>
          <div class="wl" id="waitLeft">0s</div>
          <div class="wd" id="waitDesc">Deja que el café respire.</div>
        </div>

        <div class="instruction">
          <div class="il" id="instrTitle">Ahora</div>
          <div class="it" id="instrText">—</div>
        </div>
        <div class="upnext" id="upNext">sigue: —</div>
      </div>

      <div class="done-block hide" id="doneBlock">
        <div class="bigcheck"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9cc47f" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg></div>
        <h2>¡Listo! ☕</h2>
        <p class="sub">Anótalo mientras lo tienes fresco.</p>
        <div class="statgrid">
          <div class="stat"><b id="doneCoffee">0</b><small>g café</small></div>
          <div class="stat"><b id="doneWater" style="color:var(--water)">0</b><small>g agua</small></div>
          <div class="stat"><b id="doneTime">0:00</b><small>tiempo</small></div>
        </div>

        <div class="field"><label>¿Qué tal quedó?</label><div class="stars" id="starsF"></div></div>
        <div class="field"><label>Perfil de sabor</label><div class="tastes" id="tastesF"></div></div>
        <div class="field"><label>Punto del molino</label><input id="grindF" placeholder="ej. clic 4 de 6"></div>
        <div class="field">
          <label>Café (opcional)</label>
          <input id="bagF" placeholder="busca o crea una ficha…" autocomplete="off">
          <div class="suggest" id="bagSuggest"></div>
        </div>
        <div class="field"><label>Notas (origen, tueste, qué cambiar)</label><textarea id="notesF" placeholder="ej. Geisha de Tolima, tueste medio. Salió un pelín ácido → probar 1 clic más fino."></textarea></div>

        <div class="btn-row">
          <button class="btn ghost" id="discardBtn">Descartar</button>
          <button class="btn primary" id="saveEntryBtn">Guardar en bitácora</button>
        </div>
      </div>

      <div class="spacer"></div>

      <div class="hide" id="finishWrap">
        <button class="btn ghost" id="finBtn">Terminé el vertido</button>
        <p class="fin-help">Tú decides cuándo el agua ya bajó lo suficiente — la molienda y el café varían el tiempo de drenado.</p>
      </div>
    `;

    const q = <T extends Element>(id: string): T => {
      const el = section.querySelector<T>(`#${id}`);
      if (!el) throw new Error(`Falta #${id} en BrewScreen`);
      return el;
    };

    this.refs = {
      live: q<HTMLElement>("liveWrap"),
      doneBlock: q<HTMLElement>("doneBlock"),
      ringFg: q<SVGCircleElement>("ringFg"),
      modeWord: q<HTMLElement>("modeWord"),
      bigTime: q<HTMLElement>("bigTime"),
      nextIn: q<HTMLElement>("nextIn"),
      paceFalta: q<HTMLElement>("paceFalta"),
      paceGhost: q<HTMLElement>("paceGhost"),
      paceTarget: q<HTMLElement>("paceTarget"),
      paceRate: q<HTMLElement>("paceRate"),
      paceFill: q<HTMLElement>("paceFill"),
      waitMsg: q<HTMLElement>("waitMsg"),
      waitLeft: q<HTMLElement>("waitLeft"),
      waitDesc: q<HTMLElement>("waitDesc"),
      instrTitle: q<HTMLElement>("instrTitle"),
      instrText: q<HTMLElement>("instrText"),
      upNext: q<HTMLElement>("upNext"),
      finishWrap: q<HTMLElement>("finishWrap"),
      doneCoffee: q<HTMLElement>("doneCoffee"),
      doneWater: q<HTMLElement>("doneWater"),
      doneTime: q<HTMLElement>("doneTime"),
      starsF: q<HTMLElement>("starsF"),
      tastesF: q<HTMLElement>("tastesF"),
      grindF: q<HTMLInputElement>("grindF"),
      notesF: q<HTMLTextAreaElement>("notesF"),
      bagF: q<HTMLInputElement>("bagF"),
      bagSuggest: q<HTMLElement>("bagSuggest"),
      discardBtn: q<HTMLElement>("discardBtn"),
      saveEntryBtn: q<HTMLElement>("saveEntryBtn"),
    };

    q<HTMLElement>("cancelBtn").addEventListener("click", () => this.cancelBrew());
    q<HTMLElement>("finBtn").addEventListener("click", () => {
      this.manualRequested = true;
      this.tick(); // pasa a FIN de inmediato
    });

    // Formulario de cata: prellenar molino y renderizar estrellas/sabores.
    const profile = loadProfile();
    const click = getGrindClick(profile, recipe.recommendedClickOffset);
    this.refs.grindF.value = `clic ${click} de ${profile.grinderClicks}`;
    this.renderStars();
    this.renderTastes();
    this.refs.bagF.addEventListener("input", () => this.renderBagSuggestions());
    this.refs.discardBtn.addEventListener("click", () => this.cancelBrew());
    this.refs.saveEntryBtn.addEventListener("click", () => this.saveEntry());

    return section;
  }

  // Autocompletado de ficha de café en el formulario de cata (H6).
  private renderBagSuggestions(): void {
    const refs = this.refs!;
    const query = refs.bagF.value.trim();

    // Cualquier tecleo invalida la selección previa hasta volver a elegir.
    this.selectedBagId = null;
    this.pendingBagName = null;

    if (!query) {
      refs.bagSuggest.innerHTML = "";
      return;
    }

    const matches = searchCoffeeBags(loadCoffeeBags(), query);
    const exact = matches.some(
      (b) => b.name.toLowerCase() === query.toLowerCase()
    );

    let html = matches
      .map(
        (b) =>
          `<div class="sug" data-id="${b.id}" data-name="${escapeHtml(b.name)}">${escapeHtml(b.name)}<span class="sb">${escapeHtml(b.brand || "—")}</span></div>`
      )
      .join("");
    if (!exact) {
      html += `<div class="sug create" data-create="1">+ Crear ficha: ${escapeHtml(query)}</div>`;
    }
    refs.bagSuggest.innerHTML = html;

    refs.bagSuggest.querySelectorAll<HTMLElement>(".sug").forEach((el) => {
      el.addEventListener("click", () => {
        if (el.dataset.create) {
          this.pendingBagName = query;
          this.selectedBagId = null;
          refs.bagF.value = query;
        } else {
          this.selectedBagId = el.dataset.id ?? null;
          this.pendingBagName = null;
          refs.bagF.value = el.dataset.name ?? "";
        }
        refs.bagSuggest.innerHTML = "";
      });
    });
  }

  // ── Formulario de cata (FIN) ───────────────────────────

  private renderStars(): void {
    const refs = this.refs!;
    refs.starsF.innerHTML = [1, 2, 3, 4, 5]
      .map((n) => `<span class="star${n <= this.rating ? " on" : ""}" data-n="${n}">★</span>`)
      .join("");
    refs.starsF.querySelectorAll<HTMLElement>(".star").forEach((star) => {
      star.addEventListener("click", () => {
        this.rating = Number(star.dataset.n);
        this.renderStars();
      });
    });
  }

  private renderTastes(): void {
    const refs = this.refs!;
    refs.tastesF.innerHTML = TASTE_OPTS.map(
      (t) => `<span class="taste${this.tastes.has(t) ? " on" : ""}" data-t="${t}">${t}</span>`
    ).join("");
    refs.tastesF.querySelectorAll<HTMLElement>(".taste").forEach((chip) => {
      chip.addEventListener("click", () => {
        const t = chip.dataset.t!;
        if (this.tastes.has(t)) this.tastes.delete(t);
        else this.tastes.add(t);
        this.renderTastes();
      });
    });
  }

  private saveEntry(): void {
    const recipe = this.recipe;
    if (!recipe) return;

    // Vínculo opcional con una ficha de café: existente, nueva, o ninguno.
    let coffeeBagId: string | undefined;
    if (this.selectedBagId) {
      coffeeBagId = this.selectedBagId;
    } else if (this.pendingBagName) {
      coffeeBagId = "bag-" + Date.now();
      saveCoffeeBag({ id: coffeeBagId, name: this.pendingBagName, brand: "" });
    }

    const entry: JournalEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      recipe: recipe.name,
      coffee: this.dose,
      water: Math.round(this.dose * recipe.ratio),
      time: formatClock(this.finishElapsed),
      rating: this.rating,
      tastes: [...this.tastes],
      grind: this.refs!.grindF.value.trim(),
      notes: this.refs!.notesF.value.trim(),
    };
    if (coffeeBagId) entry.coffeeBagId = coffeeBagId;

    addEntry(entry);
    this.cancelBrew(); // limpia y vuelve a SETUP
  }

  // ── Wake Lock (mantener pantalla encendida) ────────────

  private async requestWakeLock(): Promise<void> {
    try {
      if (!("wakeLock" in navigator)) return;
      this.wakeLock = await navigator.wakeLock.request("screen");
    } catch {
      this.wakeLock = null;
    }
  }

  private async releaseWakeLock(): Promise<void> {
    try {
      await this.wakeLock?.release();
    } catch {
      // ignorar
    } finally {
      this.wakeLock = null;
    }
  }

  // ── util ───────────────────────────────────────────────

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private mount(el: HTMLElement): void {
    this.root.innerHTML = "";
    this.root.append(el);
  }
}

/** mm:ss a partir de segundos. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

/** Duración modelada de la receta = fin del último vertido (en segundos). */
export function recipeTotalDuration(recipe: Recipe): number {
  return recipe.steps.reduce(
    (max, s) => Math.max(max, s.startAt + s.pourDuration),
    0
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
