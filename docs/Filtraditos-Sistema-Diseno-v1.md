# Filtraditos — Sistema de Diseño
**Capa 0 · Japonés hand drip · Analógico · Ritualista**

**Autor:** CASCARA · **Para:** agente de frontend / GUSTAVITO · **Versión:** 1.0

---

## 0. La filosofía en una línea

El café de especialidad no es tecnológico. Es textura, olor, sentimiento, calidez. La interfaz debe sentirse como tinta sobre papel washi, no como una app. **La interfaz ES el producto.**

Regla mental para cualquier decisión visual: *si se siente como una app de productividad genérica, está mal.* Si se siente como un objeto artesanal — un cuaderno de barista, un sello estampado, una nota escrita a mano — está bien.

---

## 1. Paleta

Blanco y negro japonés con un solo acento ámbar. **No** monocromático café (eso es lo que hace todo el mercado). El contraste es tinta sobre papel; el ámbar es la chispa de magia, usado con extrema parsimonia.

| Token | Hex | Uso |
|---|---|---|
| `--papel` | `#F5F0E4` | Fondo base de toda la app |
| `--papel-card` | `#F0EAD8` | Superficie de tarjetas y botones de papel |
| `--tinta` | `#120A02` | Tipografía principal, botones primarios, ilustración |
| `--tinta-suave` | `#3A2810` | Texto secundario sobre papel |
| `--ambar` | `#9B5602` | Acento único — ver regla de parsimonia abajo |
| `--ambar-marca` | `#EBD4A8` | Fondo de botones de marca (papel teñido) |
| `--gris-papel` | `#8A7A5E` | Labels, meta, texto terciario |
| `--gris-tenue` | `#A8987A` | Texto de menor jerarquía |
| `--verde-oliva` | `#5A7A38` | Estado positivo (veredicto "Esto es", éxito) |

### Regla de parsimonia del ámbar

El ámbar aparece **solo donde hay magia o acción con intención**. Nunca como decoración constante. En una pantalla típica aparece en máximo 2-3 lugares:
- La sombra "tamper" del wordmark y de los botones primarios
- El punto/dot de la acción principal
- La gota de agua en la ilustración (donde el agua toca el café)
- El número gigante cuando entra en estado de aviso (tintineo)

Si el ámbar aparece en más de 3 lugares en una pantalla, hay que quitar alguno.

---

## 2. Tipografía

Tres tipografías, tres roles estrictos. **La regla más importante:** los titulares en tipografía grande y pesada **se reservan para lo útil** — contadores, números del ritual, valores de acción. **Nunca para títulos narrativos.** Un título que solo dice "Vamos a entenderla" no va en tipografía gigante; el número "23 g" sí.

### Big Shoulders Display 900 — lo útil

Bold, pesada, alargada, con presencia. Cubre el espacio, dice "yo estoy aquí". A tamaño grande se siente como una pieza de reloj analógico que cambia minuto a minuto.

**Usos permitidos:**
- Números del ritual (agua faltante, segundos de colado): 120–160px
- Valores de acción concreta ("BAJÁ UN CLIC" en sugerencia, "CLIC 3"): 40–80px
- Wordmark FILTRADITOS
- Datos del recap en éxito (18g, 300g, Clic 4)
- Nombres de receta en el carrusel

**Prohibido:** títulos narrativos, preguntas emocionales, texto explicativo.

Siempre con `letter-spacing` negativo (`-0.02em` a `-0.04em`) y `line-height` cercano a 0.85–0.9.

### Tipografía manuscrita — el momento emocional

⚠️ **PENDIENTE DE DECISIÓN.** Caveat se probó y no convence — se siente demasiado casual. Alternativas a evaluar: Reenie Beanie, Kalam, Homemade Apple, Shadows Into Light. El objetivo es que se sienta como "notas de un cuaderno de barista", no como letra infantil.

**Uso previsto (una vez elegida):** solo la pregunta del veredicto ("¿Cómo estuvo?") y copy emocional muy puntual. Es el único momento donde entra la mano escrita, y por eso pesa. No usar en ningún otro lado.

### DM Sans 300/400/500 — la interfaz funcional

Limpia, legible, subordinada. Nunca compite con Big Shoulders.

**Usos:** labels, meta contextual (receta · dosis · clic), descripciones de tarjetas, texto de botones, estados del status track, cualquier texto de interfaz que no sea un número protagonista.

---

## 3. Superficie — tarjetas y botones

**Estilo aprobado: papel washi + embossed reforzado, esquinas casi cuadradas (radio 4px).**

Rechazado explícitamente: islas con bordes finos y sombreado oscuro, glassmorphism, cualquier borde de 1px visible.

### Tarjeta base

```css
.card {
  background: #F0EAD8;
  border-radius: 4px;
  padding: 18px 16px;
  position: relative;
  overflow: hidden;
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,.7),
    inset 0 -2px 0 rgba(26,18,8,.11),
    inset 2px 0 0 rgba(255,255,255,.35),
    inset -2px 0 0 rgba(26,18,8,.05);
}
/* Textura washi: manchas orgánicas ámbar muy suaves */
.card::before {
  content:'';
  position:absolute; inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 25% 20%, rgba(155,86,2,.055) 0%, transparent 45%),
    radial-gradient(circle at 75% 75%, rgba(155,86,2,.045) 0%, transparent 45%),
    radial-gradient(circle at 90% 10%, rgba(26,18,8,.035) 0%, transparent 30%),
    radial-gradient(circle at 15% 85%, rgba(26,18,8,.025) 0%, transparent 35%);
}
```

El embossed es sombra interna en los cuatro lados: brillo arriba/izquierda, oscuro abajo/derecha. Se percibe prensado en tres dimensiones.

### Fondo washi de la app

Textura de dos capas de `feTurbulence` a opacidad muy baja (~0.06) sobre `#F5F0E4`. Una capa de grano fino (`baseFrequency 0.68 0.72`) y opcionalmente una de fibras horizontales (`baseFrequency 0.01 0.8`, opacidad ~0.025).

### Los cuatro roles de botón

Todos con radio 4px. Todos con carácter analógico.

**1 · Primario** — tinta sólida con sombra tamper ámbar. El ancla del sistema.
```css
background:#120A02; color:#F5F0E4;
box-shadow: 4px 4px 0 rgba(155,86,2,.32),
  inset 0 1px 0 rgba(255,255,255,.08),
  inset 0 -1px 0 rgba(0,0,0,.25);
```
Uso: CTA principal ("Preparar un café", "Guardar taza").

**2 · Secundario** — papel washi + embossed, texto oscuro. Misma familia que las tarjetas.
Uso: acciones tranquilas ("Volver al inicio").

**3 · Marca** — papel ámbar tenue (`#EBD4A8`) con embossed. Analógico pero con color.
Uso: acciones con carga de marca ("Guardar sugerencia").

**4 · Tinta de proceso** — tinta sólida SIN tamper.
Uso: acciones funcionales dentro del ritual ("Terminé el colado"), donde el tamper sería demasiado ceremonial.

---

## 4. Ilustración — estilo del V60

Línea única japonesa. Tinta (`#120A02`) sobre papel. Sin rellenos, solo trazo con peso variable. Los bordes son intencionalmente irregulares — tinta seca dibujada a mano, no vector perfecto.

**Técnica:** `feDisplacementMap` alimentado por `feTurbulence` sobre los paths SVG, para simular el temblor de una línea hecha a mano.

```
<filter id="tintaSeca">
  <feTurbulence type="turbulence" baseFrequency="0.038 0.032" numOctaves="5" seed="9" result="noise"/>
  <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.2" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```

Objetos en escena: V60 (cono con lados curvados), tetera gooseneck, servidor. La única gota ámbar es donde el agua toca el V60.

---

## 5. Movimiento

- **Transición de números del ritual:** estilo reloj analógico flip — el dígito voltea o hace roll vertical, no un simple fade. (Detalle a estudiar en implementación.)
- **Tintineo de aviso:** los últimos 5 segundos antes de un cambio de fase en el ritual, el número gigante parpadea cromáticamente entre tinta (`#120A02`) y café/marrón cálido. Sin texto, sin banner, sin alarma sonora. Solo aplica entre fases del ritual activo, no en la preparación.
- **Tarjetas del veredicto/diagnóstico:** al tap/hover se corren levemente (translateX 4px), como papel que responde al dedo. Física de papel, no rebote digital.
- **Carrusel de recetas:** coverflow 3D. Las tarjetas laterales en perspectiva y escala reducida. Flip manual con el dedo (touchmove → rotateY + inercia con damping) para ver el dorso.

---

## 6. Los dos usuarios — principio dual

La app sirve a la misma persona en dos momentos, y **ninguna pantalla puede sacrificar a uno por el otro:**

- **El principiante / el que solo quiere el proceso:** un tap y sigue con su vida. No ve formularios, no ve profundidad obligatoria.
- **El metódico:** quiere registrar, comparar, entender. Encuentra la profundidad cuando la busca.

La técnica es **profundidad opcional escondida**: la acción rápida siempre visible, la profundidad detrás de un expand/botón secundario. Ejemplo: la sugerencia muestra "BAJÁ UN CLIC" para todos, pero el "POR QUÉ ▾" con el razonamiento solo lo abre quien quiere.

---

## 7. Anti-patrones — lo que NO hacemos

- ❌ Islas con bordes finos de 1px y sombreado oscuro
- ❌ Glassmorphism / blur
- ❌ Paleta monocromática café (todo el mercado la usa)
- ❌ Negro puro (#000) o gris frío o azul
- ❌ Tipografía grande para títulos narrativos
- ❌ Confeti, puntos, badges, rachas visibles (gamificación barata)
- ❌ Formularios en el momento emocional
- ❌ Ámbar como decoración constante
- ❌ Información de relleno durante el ritual (tips, curiosidades, notas de cata sugeridas) — el silencio es parte del producto
