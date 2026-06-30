// Arranque de la app. Monta la pantalla principal en #app. Toda la lógica
// de café vive en el engine; aquí solo conectamos la UI.
import "./ui/styles.css";
import { BrewScreen } from "./ui/BrewScreen";

const app = document.querySelector<HTMLElement>("#app");
if (!app) {
  throw new Error("No se encontró el contenedor #app en index.html");
}

new BrewScreen(app);
