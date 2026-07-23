# Map Rebuild — Aethergate Town and playable interiors from mockups

Rebuilds the in-game town to match `docs/mockups/region-01-everbloom/aethergate-town/aethergate-town-map.png`,
using only images/assets from `docs/mockups/` for the map visuals.

## Contents
- [`mockup-analysis.md`](mockup-analysis.md) — full analysis: engine/map model, every mockup file's
  target scene, tested scale decision, coordinates, verification, limitations.
- [`asset-manifest.json`](asset-manifest.json) — generated crop manifest (source rects, sizes,
  hashes, anchors, usage) for the 13 building depth-slices.
- [`interior-asset-manifest.json`](interior-asset-manifest.json) — source crops, exact dimensions and
  hashes for the four standalone service interiors.
- `screenshots/` — live-browser captures (overview, desktop, mobile).
- `backup/` — pre-rebuild originals (`town-night.png`, `TownScene.ts`, `interiors.ts`, `npcs.ts`).

## Repeatable pipeline
```
python scripts/map-rebuild/crop_town_slices.py     # export town slices + regenerate manifest
node   scripts/map-rebuild/crop-interiors.cjs        # export 4 standalone 1:1 interior maps
node   scripts/playtest-town.mjs                     # Town movement/camera/runtime smoke
node   scripts/playtest-interiors.mjs                # 4 rooms + click-path + shadow smoke
```

## What changed in the game
- `public/town-art/aethergate-town.png` — the new town map (copied from the mockup).
- `app/game/scenes/TownScene.ts` — `TOWN_ART_SCALE=1.5`, new `ZONES` (22 collision boxes),
  `SLICES` (13 depth layers), light/window/portal FX, spawn at the south arrival gate, camera/world bounds.
- `public/interior-maps/` — four standalone 1:1 room maps cropped from the approved core-interiors board.
- `app/data/town/interiors.ts` — room dimensions, return spawns, foot collision, y-sort occluders and practical lights.
- `app/game/scenes/InteriorScene.ts` — playable room renderer with NPC/service/exit hooks and MMORPG movement.
- `app/data/world1/npcs.ts` — NPC positions moved next to their new buildings (Kael guards the portal).
