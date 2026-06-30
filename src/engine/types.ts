// Tipos puros del motor de receta. Sin DOM, sin timers, sin Date.now().
// La UI solo lee estos tipos; nunca decide tiempos ni agua por su cuenta.

export interface RecipeStep {
  /** Segundos desde el inicio del brew en que arranca este vertido. */
  startAt: number;
  /**
   * Segundos que dura el vertido. Pasado este lapso (startAt + pourDuration)
   * el paso entra en "espera". Aquí se atrapa el bug de v1: si pourDuration
   * cubriera todo el hueco hasta el siguiente paso, nunca habría "espera".
   */
  pourDuration: number;
  /** Gramos de agua de este vertido, ya escalados a la dosis usada. */
  waterAmount: number;
  /** Etiqueta opcional para la UI ("Bloom", "Vertido 2", ...). */
  label?: string;
}

export interface Recipe {
  /** Identificador estable (slug). */
  id: string;
  /** Nombre visible en UI (español). */
  name: string;
  /** Proporción agua:café. ratio 16.7 = 16.7 g de agua por 1 g de café. */
  ratio: number;
  /**
   * Pasos de vertido ya calculados para una dosis concreta. Se construyen
   * con los factories de `recipes.ts`, que escalan el agua según la dosis
   * (H2: nada de dosis fija de ejemplo).
   */
  steps: RecipeStep[];
}
