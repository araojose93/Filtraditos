// Pantalla de Perfil de equipo — molino por clics (H3, port de s-profile).
// Solo edita el total de clics; el baseClick se deriva (punto medio) en
// equipmentProfile. Al guardar, persiste y vuelve a SETUP, que releerá el
// perfil y mostrará la molienda en clics reales.

import {
  loadProfile,
  saveProfile,
  makeProfile,
  MIN_CLICKS,
  MAX_CLICKS,
} from "./equipmentProfile";

export interface ProfileScreenOptions {
  onBack: () => void;
}

export class ProfileScreen {
  readonly el: HTMLElement;
  private clicks: number;
  private refs!: { clicksVal: HTMLElement; cMin: HTMLElement; cMax: HTMLElement };

  constructor(private opts: ProfileScreenOptions) {
    this.clicks = loadProfile().grinderClicks;
    this.el = document.createElement("section");
    this.el.className = "screen";
    this.build();
  }

  private build(): void {
    this.el.innerHTML = `
      <div class="brand">
        <div class="dot"></div>
        <h1>Tu equipo</h1>
        <button class="x" id="profileBack" aria-label="Volver" style="margin-left:auto">✕</button>
      </div>

      <div class="eyebrow">Molino</div>
      <h2 style="margin-bottom:14px">¿Cuántos clics tiene?</h2>
      <p class="sub">Lo configuras una vez y todas las recetas te dirán la
        molienda <b>en tus clics</b>, no en palabras abstractas.</p>

      <div class="dose">
        <div class="row">
          <label>Número de clics</label>
          <div class="stepper">
            <button id="clicksMinus" aria-label="Menos clics">−</button>
            <div class="val"><span id="clicksVal">${this.clicks}</span><small> clics</small></div>
            <button id="clicksPlus" aria-label="Más clics">+</button>
          </div>
        </div>
        <div class="summary">
          <div>Más fino<b id="cMin">clic 1</b></div>
          <div class="w">Más grueso<b id="cMax">clic ${this.clicks}</b></div>
        </div>
      </div>

      <p class="sub" style="font-size:12px">Convención: <b>1 = más fino</b>,
        el número mayor = más grueso (como tu molino).</p>

      <div class="spacer"></div>

      <button class="btn primary" id="saveBtn">Guardar</button>
    `;

    const q = (id: string): HTMLElement => {
      const el = this.el.querySelector<HTMLElement>(`#${id}`);
      if (!el) throw new Error(`Falta #${id} en ProfileScreen`);
      return el;
    };

    this.refs = {
      clicksVal: q("clicksVal"),
      cMin: q("cMin"),
      cMax: q("cMax"),
    };

    q("clicksMinus").addEventListener("click", () => this.changeClicks(-1));
    q("clicksPlus").addEventListener("click", () => this.changeClicks(1));
    q("profileBack").addEventListener("click", () => this.opts.onBack());
    q("saveBtn").addEventListener("click", () => {
      saveProfile(makeProfile(this.clicks));
      this.opts.onBack();
    });
  }

  private changeClicks(delta: number): void {
    this.clicks = clamp(this.clicks + delta, MIN_CLICKS, MAX_CLICKS);
    this.refs.clicksVal.textContent = String(this.clicks);
    this.refs.cMax.textContent = `clic ${this.clicks}`;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
