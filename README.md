# BrewLab

Coach de preparación V60: cronómetro guiado (vierte/espera), perfil de
molino por clics, estimación de enfriamiento de agua, y bitácora de catas.

## Por qué este repo existe
El primer prototipo era un solo archivo HTML. Funcionó para validar la
idea, pero el motor de tiempo (vierte/espera) estaba mezclado con la
interfaz y por eso el bug: el cronómetro nunca pasaba a "espera". Esta
versión separa esa lógica (`src/engine/`) y la cubre con tests, así ese
tipo de bug se atrapa antes de tocar la pantalla.

## Setup rápido

```bash
npm install
npm test     # corre los tests del motor de vertido — deberían pasar 9/9
npm run dev  # levanta la app en local (http://localhost:5173)
```

## Conectar esto a Claude Code

1. Sube esta carpeta a un repo de GitHub (o GitLab/lo que uses):
   ```bash
   git init
   git add .
   git commit -m "scaffold: engine de vertido con tests + agentes de producto/CTO"
   git remote add origin <tu-repo>
   git push -u origin main
   ```
2. Clona o abre esa carpeta en tu máquina con Claude Code.
3. Claude Code va a leer automáticamente `CLAUDE.md` al arrancar — ahí está
   todo el contexto: los dos agentes, la regla de "lógica separada de UI",
   y los próximos pasos sugeridos.
4. Para tareas nuevas, dale a Claude Code algo del tipo:
   > "Lee CLAUDE.md y agents/CASCARA.md. Quiero migrar el catálogo de
   > recetas del prototipo HTML a src/engine/recipes.ts con tipos Recipe."

## Estructura

```
src/engine/        lógica pura y testeada (la receta, el reloj, el ritmo)
src/ui/            UI (por ahora vacío — siguiente paso es portar el HTML)
agents/            CASCARA.md (producto) y GUSTAVITO.md (CTO/arquitectura)
CLAUDE.md          contexto que Claude Code lee al abrir el proyecto
```

## El prototipo original
El HTML de un solo archivo (con toda la UI, recetas, y el bug de
vierte/espera) queda como referencia visual en `legacy/brewlab-prototype.html`
— útil para portar diseño y copy, no para portar la lógica de tiempo.
