# ASSET_FIX_LOG

Chronological log of asset processing / integration changes. Originals in `D:\Asset` are never modified;
all derived assets are generated into the project (`public/`, `assets/`) via reproducible scripts.

## 2026-07-06

### Added — boss spritesheets (craftpix-561178 → Phaser strips)
- **New script:** `scripts/sprite-crop/build-bosses.cjs` — composites individual per-frame PNGs into
  horizontal strip spritesheets using `sharp` (no per-frame trim → stable pivot). Auto-detects frame
  size and frame count from disk.
- **Generated:** `public/mob-sprites/`
  - `boss_dragon_idle.png` (256×256 ×3), `boss_dragon_walk.png` (×5)
  - `boss_demon_idle.png` (256×256 ×3), `boss_demon_walk.png` (×6)
  - `boss_medusa_idle.png` (128×128 ×3), `boss_medusa_walk.png` (×4)
  - `boss_small_dragon_idle.png` (128×128 ×3), `boss_small_dragon_walk.png` (×4)
  - `_boss_manifest.json` (frame sizes + counts)
- **Wired in:** `app/game/systems/textures.ts` (preload + anims + `bossVisualForFloor()`),
  `app/game/scenes/TowerScene.ts` (animated boss + shadow + float tween + shrunk physics body).
- **Retired:** `mob_dragon` (static 963-byte `dragon.png`) — no longer referenced.
- **Verified:** live preview, boss floor 10 — all 4 sheets load, correct sizes, anims playing, crisp.

### Added — asset scan tooling
- **New script:** `scripts/sprite-crop/scan-assets.ps1` — reads PNG/IHDR headers across `D:\Asset`,
  emits `scratchpad/asset-scan.csv` (14,449 rows) + per-pack dimension histogram. Basis for
  `ASSET_MASTER_INDEX.md`.

### Dev tooling
- `app/components/game/GameCanvas.client.vue` — added `import.meta.dev`-guarded `window.__game` handle
  for preview/verification (jump floors, inspect scenes). No-op in production builds.

## 2026-07-07

### Character sprites unified — map-walking sprite == UI icon (Main Character Asset)
- **Source analysed:** `D:\Asset\Main Character Asset\Character Asset\Occupation.png` (1402×1122). Thai
  labels confirm layout: นักรบ(Warrior)/นักธนู(Archer)/นักเวท(Mage)/นักโล่ป้องกัน(Guardian), each ชาย(male)/
  หญิง(female), sub-columns Idle/Movement; rows = down/left/right/up. Style = 64×64 JRPG (per overview
  sheet `Character Asset.png`).
- **New script:** `scripts/sprite-crop/build-overworld.cjs` — flood-fill crops the 8 class×gender cells
  into UNIFORM Phaser sheets (4 dir × [idle,move]) **and** a matching down-idle icon from the *same*
  cells, so the two can't drift apart.
- **Generated:** `public/character-sprites/<class>_<gender>.png` (+ `_sheet_manifest.json`) and
  `public/character-icons/<class>_<gender>.png` — 8 each.
- **Wired in:**
  - `app/game/systems/textures.ts` — `CLASS_SHEETS` manifest, `heroKey/heroAnim/heroSheetSize`,
    per class×gender idle/walk anims. Retired old `player-sprites/overworld/*` chibi sprites.
  - `app/game/scenes/TowerScene.ts` + `TownScene.ts` — player sprite now gender-aware, scaled to ~48px,
    foot-anchored. Removed the placeholder `CharacterLayeredSprite` equipment overlay from the map (the
    JRPG sprite already includes the class outfit + weapon, matching the icon).
  - `app/pages/index.vue` + `classIcon()` — class-select buttons and the character card now show
    `character-icons/<class>_<gender>.png`.
- **Verified:** live preview, female Guardian — icon and in-map sprite are identical; all 4 directions
  have idle+walk anims (frame pairs down[0,1]/left[2,3]/right[4,5]/up[6,7]); TownScene + TowerScene both
  render; assets return 200; zero console errors.
- **Note:** `characterLayeredSprite.ts` / `characterAppearance.ts` / `equipmentVisualMap.ts` remain in the
  tree (unused on the map) for a future craftpix modular-equipment layer; `classes.ts.sprite` (battle
  portraits) left untouched.

## Standardization decisions (applied going forward)
- Derived sprites live under `public/` (runtime) or `assets/` (source crops); scripts under
  `scripts/sprite-crop/`. Naming: `boss_<creature>_<state>.png`, `<char>_<state>_<dir>_NN.png`.
- Do **not** per-frame trim animated creature frames (keeps pivot stable).
- Prefer integer scale factors; craftpix family only for in-world art coherence.

## Pending (not yet applied — see MAP_ASSET_USAGE / MISSING_OR_WEAK_ASSETS)
- Village tileset slicing (504452) for ground/wall variation.
- Foliage-with-shadow (141354), ruins (934618), town building set (477438/189780/504452).
- Slime recolors (788364), biome spawn tables.
