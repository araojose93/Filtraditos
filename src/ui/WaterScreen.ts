// Pestaña de Agua — temperatura en vivo (port de s-water del prototipo, sin el
// selector de tueste ni el slider de calibración, que llegan después). Toda la
// física vive en el engine puro (getWaterTemp / getWaterTempState); aquí solo
// leemos el reloj real y pintamos. El único Date.now() es el del trasvase.

import { getWaterTemp, getWaterTempState } from "../engine/temperature";

const TICK_MS = 250;
const DIAL_R = 104;
const DIAL_CIRC = 2 * Math.PI * DIAL_R;

const T_START = 95; // °C al caer en la gooseneck (igual que el engine)
const T_BAND_END = 85; // el anillo se llena al cruzar a "fría"

export interface WaterScreenOptions {
  onBack: () => void;
}

interface WaterRefs {
  tNum: HTMLElement;
  tState: HTMLElement;
  tEta: HTMLElement;
  tdFg: SVGCircleElement;
  coolBtn: HTMLElement;
}

export class WaterScreen {
  readonly el: HTMLElement;

  private boilTime = 0;
  private running = false;
  private timer: number | null = null;
  private refs!: WaterRefs;

  constructor(private opts: WaterScreenOptions) {
    this.el = document.createElement("section");
    this.el.className = "screen";
    this.build();
  }

  /** Detiene el tick. Llamar al salir de la pantalla. */
  dispose(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private build(): void {
    this.el.innerHTML = `
      <div class="brand">
        <div class="dot" style="background:conic-gradient(from 210deg,var(--water),#bfe6f2,var(--water))"></div>
        <h1>Agua</h1>
        <span class="tag">enfriamiento · Lechería</span>
        <button class="watertab" id="waterBack" aria-label="Volver">‹ Volver</button>
      </div>

      <div class="note">
        <b>Estimación, no termómetro.</b> Al pasarla a la gooseneck baja a
        ≈95 °C; desde ahí calculo la curva de enfriamiento.
      </div>

      <div class="tempdial">
        <svg viewBox="0 0 240 240" width="240" height="240">
          <defs>
            <linearGradient id="gt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8654a"/><stop offset="1" stop-color="#7fb0c4"/></linearGradient>
          </defs>
          <circle class="td-bg" cx="120" cy="120" r="104" fill="none" stroke-width="11"/>
          <circle class="td-fg" id="tdFg" cx="120" cy="120" r="104" fill="none" stroke-width="11" stroke-dasharray="${DIAL_CIRC.toFixed(0)}" stroke-dashoffset="${DIAL_CIRC.toFixed(0)}"/>
        </svg>
        <div class="tempcenter">
          <div class="tnum"><span id="tNum">${T_START}</span><span class="unit">°C</span></div>
          <div class="tstate" id="tState">listo</div>
          <div class="teta" id="tEta">pulsa "acaba de hervir"</div>
        </div>
      </div>

      <div class="spacer"></div>

      <button class="btn water" id="coolBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2s5 6 5 10a5 5 0 01-10 0c0-4 5-10 5-10z"/></svg>
        El agua acaba de hervir
      </button>
    `;

    const q = <T extends Element>(id: string): T => {
      const el = this.el.querySelector<T>(`#${id}`);
      if (!el) throw new Error(`Falta #${id} en WaterScreen`);
      return el;
    };

    this.refs = {
      tNum: q<HTMLElement>("tNum"),
      tState: q<HTMLElement>("tState"),
      tEta: q<HTMLElement>("tEta"),
      tdFg: q<SVGCircleElement>("tdFg"),
      coolBtn: q<HTMLElement>("coolBtn"),
    };

    q<HTMLElement>("waterBack").addEventListener("click", () => {
      this.dispose();
      this.opts.onBack();
    });
    this.refs.coolBtn.addEventListener("click", () => this.toggle());

    this.reset();
  }

  private toggle(): void {
    if (this.running) {
      this.reset();
      return;
    }
    this.boilTime = Date.now();
    this.running = true;
    this.refs.coolBtn.innerHTML = "Reiniciar";
    this.tick();
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  private reset(): void {
    this.dispose();
    this.running = false;
    this.setStateClass("s-ideal");
    this.refs.tNum.textContent = String(T_START);
    this.refs.tState.textContent = "listo";
    this.refs.tEta.textContent = 'pulsa "acaba de hervir"';
    this.refs.tdFg.style.strokeDashoffset = String(DIAL_CIRC);
    this.refs.coolBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2s5 6 5 10a5 5 0 01-10 0c0-4 5-10 5-10z"/></svg>
      El agua acaba de hervir`;
  }

  private tick(): void {
    const secs = (Date.now() - this.boilTime) / 1000;
    const temp = getWaterTemp(secs);
    const state = getWaterTempState(secs);

    this.refs.tNum.textContent = String(Math.round(temp));

    if (state === "ideal") {
      this.setStateClass("s-ideal");
      this.refs.tState.textContent = "ideal";
      this.refs.tEta.textContent = "en punto · vierte ahora";
    } else if (state === "bajando") {
      this.setStateClass("s-bajando");
      this.refs.tState.textContent = "bajando";
      this.refs.tEta.textContent = "aún sirve, no tardes";
    } else {
      this.setStateClass("s-fria");
      this.refs.tState.textContent = "fría";
      this.refs.tEta.textContent = "ya está fría · recaliéntala";
    }

    // El anillo se llena de 95 °C (vacío) a 85 °C (lleno) — al completarse,
    // el agua dejó de ser ideal.
    const frac = clamp((T_START - temp) / (T_START - T_BAND_END), 0, 1);
    this.refs.tdFg.style.strokeDashoffset = String(DIAL_CIRC * (1 - frac));
  }

  /** Aplica el color de estado al número y a la etiqueta. */
  private setStateClass(cls: "s-ideal" | "s-bajando" | "s-fria"): void {
    for (const el of [this.refs.tNum, this.refs.tState]) {
      el.classList.remove("s-ideal", "s-bajando", "s-fria");
      el.classList.add(cls);
    }
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
