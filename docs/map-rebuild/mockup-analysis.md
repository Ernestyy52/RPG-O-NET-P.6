# Map Rebuild — Mockup Analysis & Integration Report

> Phase 1–2 analysis for rebuilding the in-game maps to match `docs/mockups`.
> Only images/assets under `docs/mockups/` are used for map visuals (task rule #2).
> Generated 2026-07-20.

## 1. Engine & map architecture (evidence from the codebase)

- **Engine**: Nuxt 4 (SPA) + **Phaser 4**, mounted via `app/components/game/GameCanvas.client.vue`.
- **Scenes that actually render** (`app/game/scenes/`): `TownScene`, `TowerScene`,
  `DungeonScene`, `BossScene`, `InteriorScene`. Registered in `app/game/createGame.ts`
  (`floor 1`, or every "town floor", starts `TownScene`; other floors → `TowerScene`).
- **Scale contract** (`app/game/scaleContract.ts`, S-grade gate): `TILE_SIZE = 32` world px
  (source art 16px @ integer 2×), hero visual height **48px**, foot collider **18×12**,
  town speed **130 px/s**, `pixelArt: true` (nearest-neighbour). Internal viewport
  desktop **800×600**, mobile portrait **480×640**, `Scale.FIT`, zoom 1.
- **Town rendering model** (key insight): `TownScene` does **not** use a tilemap. It draws a
  single **mockup image as the whole walkable map**, then overlays:
  - invisible **collision boxes** (`ZONES`) on building footprints,
  - runtime-cropped **depth "slices"** of each building placed back on top (origin bottom-left,
    `depth = base-y`) so the hero y-sorts in front of / behind buildings,
  - **interaction triggers** on service doors, and living **light/window/portal FX**.
  This is exactly the model the task asks for, so the rebuild swaps the *old* town image for the
  new **Aethergate** mockup and re-derives every coordinate. (Task rule #5 is satisfied because
  collision + depth-sorting are handled, not bypassed.)
- **Procedural scenes** (`TowerScene`/`DungeonScene`/`BossScene`): floors are generated from
  `biomes.ts` + `floors.ts` and painted with **baked 16px tiles** from the CC0 `tiny-town` sheet
  (`app/game/systems/textures.ts`), not from a single map image.
- **Interiors** (`InteriorScene` + `app/data/town/interiors.ts`): data-driven rooms rendered from
  curated Craftpix props (`public/interior-props/`, `public/guildhall-props/`).
- **NPCs / quests / save**: `app/data/world1/npcs.ts` (ART-space positions), `interiors.ts`
  (4 legacy interior IDs `guild/item-shop/equipment-shop/hospital`, `INTERIOR_TOWN_DOORS`
  return spawns), World-1 quests/secrets. Tests lock IDs & relative sprite paths but **not**
  image dimensions or exact ART coords — so the coordinate space can change freely.

## 2. Every mockup file, and how each maps to the game

All 21 PNGs are **1536×1024** concept references. Markdown docs are design specs.

| File | Kind | Used for / target scene |
|---|---|---|
| `region-01-everbloom/aethergate-town/aethergate-town-map.png` | **map** | **TownScene** — full town composition, districts, spawn, service placement (REBUILT). |
| `…/aethergate-building-exteriors.png` | asset board | Facade/roof/sign reference for the 12 town buildings (visual reference; buildings are shown via the town image + depth slices). |
| `…/aethergate-outdoor-assets.png` | asset board | Terrain/path/water/fountain/market/tree/gate props (reference for prop identification). |
| `…/aethergate-interiors-core.png` | map (3×2) | InteriorScene refs: Guild, Hospital, Shop, Forge, Academy, Inn. |
| `…/aethergate-interiors-progression.png` | map (3×2) | InteriorScene refs: Job Hall, Gatehouse, Bank, Tailor, Town Hall, Lodge. |
| `…/aethergate-interior-assets-core.png` | asset board | Modular interior walls/floors/props (set 1). |
| `…/aethergate-interior-assets-progression.png` | asset board | Modular interior walls/floors/props (set 2). |
| `region-01-everbloom/region-01-map-mockups.png` | map (7 panels) | Region-1 zones: Aethergate Town, Whisperwood, Gelwater Fen, Rootbound Grotto, Ruined Archive, Stormgrass Plateau, Echo Citadel → campaign-zone system (dev `AethergateScene`). |
| `region-01-everbloom/region-01-asset-board.png` | asset board | Region-1 tile/prop families. |
| `region-02-sunveil/region-02-map-mockups.png` + `-asset-board.png` | map+assets | Region 2 (Copperwind, Saffron Dunes, Mirrormere, Mangrove, Buried Sun Temple) → campaign zones. |
| `region-03-emberfrost/…` | map+assets | Region 3 (Emberhaven, Ashen Steppe, Basalt Foundry, Glacier Pass, Crown of Winter). |
| `region-04-mycelial-gloam/…` | map+assets | Region 4 (Sporewood, Miresong Marsh, Lumencap, Haunted Archive, Mycelium Sanctum). |
| `region-05-skyclock-meridian/…` | map+assets | Region 5 (Skyhold, Zephyr Meadows, Broken Observatory, Brassward, Tempest Engine). |
| `region-06-astral-rift/…` | map+assets | Region 6 (Last Observatory, Starfall, Memory Constellation, Celestial Approach, Nexus). |
| `endless-tower-of-echoes/tower-room-archetypes.png` | map (4×2) | Room grammar for `TowerScene`/`DungeonScene`/endless generator (Arrival, Combat, Gauntlet, Puzzle, Vault, Sanctuary, Boss, Ascension). |
| `endless-tower-of-echoes/tower-asset-board.png` | asset board | Tower shell/sockets/hazards/rewards/overlays/boss props. |

## 3. Scope of this rebuild (evidence-driven decision)

Two references map directly to shipping walkable scenes: `aethergate-town-map.png` → `TownScene`,
and `aethergate-interiors-core.png` → the four service rooms in `InteriorScene`. Production loads
standalone 1:1 crops rather than either contact sheet wholesale; collision and y-sort data remain
separate and testable. Region maps and tower archetypes still target the campaign-zone migration
(`app/data/zones/`, dev `AethergateScene`, `docs/MAP_BUILD_STATE.md`) and the endless generator.
This pass fully rebuilds the flagship town plus its Guild, Hospital, Item Shop and Forge interiors,
with repeatable crop pipelines and provenance manifests. See §Limitations.

## 4. Scale decision (Phase 2 — tested, not assumed)

Source town image **1536×1024**. Candidate display scales were checked against hero/door/road
proportion and "high-angle town" feel:

| Scale | World size | Door (≈35px src) | Hero:door | Camera coverage | Verdict |
|---|---|---|---|---|---|
| 1.0 | 1536×1024 | 35px | 48:35 hero taller than door | whole town nearly in view | too small/flat |
| **1.5** | **2304×1536** | **52px** | **48:52 ≈ 0.9×** | ~1/3 width, ~0.4 height | **chosen** — reads as a big explorable town, high-angle |
| 2.0 | 3072×2048 | 70px | hero small | lots of empty walking | too large |

**Chosen `TOWN_ART_SCALE = 1.5`** → world **2304×1536**. Hero 48px ≈ 0.9× a door, paths
~60–90px wide (hero body 18px) — comfortable walking. Spawn (south gate) → central fountain is
~615 world px ≈ 4.7 s at 130 px/s. Verified in-browser: hero spawns at the arrival gate and walks
to the plaza; camera bounds `0,0,2304,1536`; world (walk) bounds inset to source `[55,55]–[1485,995]`.

## 5. Town element → source-pixel coordinates (measured via grid overlay)

Measured on a 64/128px coordinate-grid overlay of the source image. Full table lives in
`app/game/scenes/TownScene.ts` (`ZONES`, `SLICES`) and `docs/map-rebuild/asset-manifest.json`.

Service door → building mapping (game events preserved):

| Event | Building in mockup | Door (src px) |
|---|---|---|
| `town:guild` | Adventurers' Guild (crossed swords, blue roof, TL) | 240, 300 |
| `portal` | Tower of Echoes Gatehouse (blue portal, top-centre) | 762, 300 |
| `town:hospital` | Brightleaf Hospital (green leaf roof, TR) | 1330, 322 |
| `town:equipment-shop` | Forge & Craft (anvil, mid-left) | 418, 480 |
| `town:item-shop` | General Goods (money-bag sign, right) | 1185, 628 |

Decorative collision-only landmarks: Academy & Library, Town Hall & Chronicle, Crystal Shrine,
Festival stage, market pavilion, Notice board, Tailor, Inn, Companion Lodge/Stable, Bank,
central **fountain**, plaza **waystone**, two **arrival-gate posts**, cherry-blossom garden, plus
two **river** blockers (right edge + SW mouth). **Spawn** = south arrival gate `(762, 940)`.

## 6. Verification (Phase 8, live browser, msedge headless)

- Build `nuxt build` → exit 0. `vitest run` → **440/440 pass**.
- `node scripts/playtest-town.mjs` → **PASS, 0 console/page errors** (desktop 1000×750 + mobile 390×844).
- Live scene introspection: player spawns at `(1143,1410)` = south gate; walking north **stops at
  y≈912** (blocked by the fountain — collision proven, no pass-through); **22 wall boxes + 5 service
  triggers**; camera/world bounds correct; portal door opens Kael's dialogue → "เข้าดันเจี้ยน (Floor 2)".
- Screenshots: `docs/map-rebuild/screenshots/town-{overview,desktop-*,mobile-*}.png` and
  `.playtest/interiors/{guild,hospital,item-shop,equipment-shop}.png`.
- `scripts/playtest-interiors.mjs` → all four rooms active, click-to-walk moves 61–73px around
  collision-authored furniture, attached shadow error ≤2px, zero browser errors.

## 7. Limitations (task rule #10 / #15)

- **Region 2–6 maps, Endless Tower archetypes, and per-region asset boards are not yet wired into
  a shipping scene.** They target the campaign-zone migration (dev `AethergateScene`) and the
  endless generator, which are separate in-progress systems (`docs/MAP_BUILD_STATE.md`). The
  procedural `TowerScene/DungeonScene/BossScene` still use the baked `tiny-town` biome tiles.
  The crop pipeline (`scripts/map-rebuild/crop_town_slices.py`) + manifest are in place to extend
  the same "image map + slices + collision" technique to those scenes when their zone data lands.
- **Progression interiors** (Academy, Inn, Job Hall, Gatehouse, Bank, Tailor, Town Hall and Lodge)
  remain future content. The four currently playable service interiors are rebuilt from the core board.
- The town backdrop is a pre-rendered image scaled by 1.5× (the shipped town model); pixel art
  stays crisp via `pixelArt:true` nearest-neighbour, and depth slices are cropped 1:1 from source.
