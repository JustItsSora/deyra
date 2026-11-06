# Deyra — DESIGN.md

## Scene sentence

Dueño de un servidor de 800 miembros, a las 22:40, en su cuarto iluminado solo por el
monitor: acaba de bloquear el spam de un raid de insultos y abre el panel para decidir la
sanción. Busca calma y precisión, no brillos.

## Estrategia de color

**Drenched**: el lienzo ES el color, un verde tinta profundo tintado (nunca #000). El hueso
sobrio marca el texto; la cera roja (vermellón) es un sello, ≤10% de superficie; el latón
envejecido es un instrumento y un detalle. Nada de teal brillante sobre negro, nada de
gradientes "AI".

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `oklch(0.16 0.03 165)` | fondo, verde tinta |
| `--surface` | `oklch(0.21 0.028 165)` | panel/tabla |
| `--surface-2` | `oklch(0.25 0.026 165)` | hover/activo |
| `--border` | `oklch(0.32 0.025 165)` | línea base |
| `--text` | `oklch(0.93 0.022 88)` | hueso |
| `--muted` | `oklch(0.72 0.022 95)` | hueso apagado |
| `--accent` | `oklch(0.55 0.18 33)` | cera roja (sellar, actuar) |
| `--brass` | `oklch(0.72 0.11 85)` | regla fina/detalles |

OKLCH en todo, nunca negro ni blanco puros.

## Tipografía

- **Display**: Marcellus (ya cargada) — lapidario, institucional, corta.
- **Texto y datos**: Manrope — humana, legible a 13px.
- **Mono**: ui-monospace del sistema — conadnistrative data legible en specs.

Escala: 1.25 mínimo entre pasos. Títulos ≥ 2.5× el body.

## Layout

- Una sección, una idea; ninguna sección corta la siguiente a la mitad (hero solo).
- Bordes laterales iguales (120–1240 px max-width).
- Sin grid uniforme de cards; jerarquía por editorial.
- El retrato es circular, estático, enmarcado con aro de bronce y sello.

## Elevation y superficie

Sin sombras flotantes decorativas; separación por tono y borde. Paneles: 1px `border`
completo, nunca franja lateral de 3px. Estados: además de color, icono + etiqueta siempre.

## Motion

Solo si significa algo: hover en botones/links (140–200 ms, `cubic-bezier(.16,1,.3,1)`),
sonidos del panel, contadores. El retrato y los anillos no se mueven nunca.

## Components

- Botón "Sellar" (primario): cera roja sólida, texto hueso, sin gradiente.
- Botón "Ver archivo" (secundario): 1px `--border`, hueso.
- Paneles de datos: fila editorial numérica (`01`…`06`) con filete latón, no cards.
- El retrato siempre dentro de un aro (medallón), nunca full-bleed sangrado.
