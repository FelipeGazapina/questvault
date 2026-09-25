# Family-mode pixel art

Generators for the art used by the family redesign (design canvas "QuestVault — Redesign RPG").

| Script | Output |
|---|---|
| `render-props.mjs` | Shaded, auto-outlined props (chest, quest board, hourglass, gate, banners, bell, helm…) → `out/props/*.svg` |
| `render-scenes.py` | Procedural scenes: castelo, ruínas, taverna, biblioteca, portão (+ `portao-faixa` band) → `out/scenes/*.png` |
| `export-app-assets.py` | Nearest-neighbour upscale into `app/assets/rpg/` (props 12×, scenes 9×) |

```bash
node render-props.mjs && python3 render-scenes.py && python3 export-app-assets.py   # needs pillow + numpy
```

Every scene ends in dark ground that dithers into the app background (`#13100d`); screens overlap
their content onto that ground (`Screen` in `app/src/components/ui.tsx`).
