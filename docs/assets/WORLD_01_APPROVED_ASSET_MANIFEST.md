# World 1 — Approved Asset Manifest (APPROVED + REUSABLE only)

Companion to `WORLD_01_ASSET_READINESS_AUDIT.md`. Lists every asset cleared to build the World-1
(forest, floors 1–10) vertical slice from — either already wired, or wireable without any new art
(no generation, no restyling). Wire-in target names the scene/loader/component that consumes (or
should consume) the file.

## Town

| Path | Dims | Wire-in target |
|---|---|---|
| `public/town-art/town-night.png` | 1404x712 | `TownScene.ts` (backdrop, WIRED) |
| `public/tiny-town/tilemap_packed.png` | 192x176 (16px tiles) | `textures.ts` → `TownScene.ts` / `TowerScene.ts` / `BossScene.ts` (baked tiles, WIRED) |

## Fields (forest overworld floors)

| Path | Dims | Wire-in target |
|---|---|---|
| baked biome textures (`buildBiomeTextures`, source: `tiny-town` tileset) | 32x32/tile | `textures.ts` → `TowerScene.ts` (WIRED) |

## Dungeon (mini + main) — REUSABLE, blocked-on-scene

Art is present, licensed, and style-correct; no consuming scene exists yet. **Wire-in target is a
Phase-14 engineering deliverable** (standalone `DungeonScene.ts`, two layout configs) — see gaps doc.

| Path | Dims | Wire-in target |
|---|---|---|
| `public/tiny-dungeon/tilemap_packed.png` | 192x176 (16px tiles) | future `DungeonScene.ts` floor/wall tiles (via `assetPath()`, zone-scoped load) — NOT YET WIRED |
| `public/dungeon-assets/walls_floor.png` | 208x368 (13×23 @ 16px) | future `DungeonScene.ts` wall-facing set — NOT YET WIRED |

## Boss arena

| Path | Dims | Wire-in target |
|---|---|---|
| baked biome textures via `biomeFloorKey()` | 32x32/tile | `BossScene.ts` (WIRED) |
| Graphics-drawn stone ring/walls (code, no file) | n/a | `BossScene.ts` (WIRED) |

## Four classes

| Path | Dims | Wire-in target |
|---|---|---|
| `public/character-sprites/hero-atlas.png` + `hero-atlas.json` | 660x784 | `textures.ts` `HERO_ATLAS` → `TownScene.ts`/`TowerScene.ts`/`BossScene.ts` (WIRED) |
| `public/character-icons/warrior_male.png` | ~150x150 | `index.vue` class picker, `BattleModal.vue` (WIRED) |
| `public/character-icons/warrior_female.png` | ~150x150 | same (WIRED) |
| `public/character-icons/mage_male.png` | ~150x150 | same (WIRED) |
| `public/character-icons/mage_female.png` | ~150x150 | same (WIRED) |
| `public/character-icons/archer_male.png` | ~150x150 | same (WIRED) |
| `public/character-icons/archer_female.png` | ~150x150 | same (WIRED) |
| `public/character-icons/guardian_male.png` | ~150x150 | same (WIRED) |
| `public/character-icons/guardian_female.png` | ~150x150 | same (WIRED) |
| `public/character-sprites/{warrior,mage,archer,guardian}_{male,female}.png` (8 files, backup) | ~150x644 | none required — atlas supersedes; keep as fallback source only |

## 5 forest fodder monsters (incl. mini-boss; 5 fodder + 2 elites + 1 boss = 8 combat visuals)

| Path | Dims | Wire-in target |
|---|---|---|
| `public/mob-sprites/mca/slime.png` | 128x128 | `textures.ts` per-theme loader → `TowerScene.ts` (WIRED) |
| `public/mob-sprites/mca/big_slime.png` | 128x128 | same, bossScale 150 (WIRED, mini-boss floors) |
| `public/mob-sprites/mca/nature_slime.png` | 128x128 | same (WIRED) |
| `public/mob-sprites/mca/mushroom_monster.png` | 128x128 | same (WIRED) |
| `public/mob-sprites/mca/frog_monster.png` | 128x128 | same (WIRED) |

## 2 elites (reuse via tint/scale — no new art)

| Path | Dims | Wire-in target |
|---|---|---|
| `public/mob-sprites/mca/nature_slime.png` (tinted + scaled ~130%) | 128x128 | `textures.ts` — add elite variant key, same mechanism as `big_slime` bossScale (needs 1 small code change, not art) |
| `public/mob-sprites/mca/mushroom_monster.png` (tinted + scaled ~130%) | 128x128 | same |

## 1 boss

| Path | Dims | Wire-in target |
|---|---|---|
| `public/mob-sprites/world-boss/world01.png` | 128x128 | `bossVisualForFloor` → `BossScene.ts` (WIRED, static fallback) |
| `public/mob-sprites/world-boss/world01_idle.png` | 640x160 (5 frames) | `ensureWorldBossAnim` → `BossScene.ts` (WIRED, idle loop) |

## NPCs

| Path | Dims | Wire-in target |
|---|---|---|
| `public/npc/portal_gate.png` | 190x414 | `TownScene.ts` landmark (WIRED) |
| `public/npc/portal_guardian.png` | 200x200 | `PortalModal.vue` dialogue portrait (WIRED) |
| `public/interior-props/guildmaster.png` | 32x32 | none yet — recommend wiring into a future Guild Hall interior view alongside `guild_hall_exterior.png` |

## Buildings

| Path | Dims | Wire-in target |
|---|---|---|
| `public/exterior-props/guild_hall_exterior.png` | 144x111 | `TownScene.ts` (WIRED) |
| `public/exterior-props/guild_hall_sign.png` | 72x26 | `TownScene.ts` — trivial add as decor layered on the guild hall exterior |

## Props

| Path | Dims | Wire-in target |
|---|---|---|
| `public/interior-props/shop_stall.png` | 96x96 | `TownScene.ts` (WIRED) |
| `public/interior-props/{shop_barrel,shop_crate,guild_floor0,guild_floor1,guild_wall,guild_banner,guild_chest,guild_plant,wardrobe,shelf-jars}.png` | 16–96px | none yet — reserve for a Guild Hall interior scene (town flavor, not slice-blocking) |
| `public/guildhall-props/{bookshelf,plant,questboard,staircase}.png` | ~25–64px | none yet — same as above; `staircase.png` specifically reserved for the future dungeon-entry landmark |

## Landmarks

| Path | Dims | Wire-in target |
|---|---|---|
| `public/npc/portal_gate.png` | 190x414 | `TownScene.ts` (WIRED, dual-purpose NPC+landmark) |
| `public/guildhall-props/staircase.png` | ~64px | reserved for dungeon-entry landmark once a dungeon-interior scene exists (see gaps doc) |

## Quest items

| Path | Dims | Wire-in target |
|---|---|---|
| `public/quest-icons/torch.png` | 96x96 | `TownScene.ts` decor (WIRED) |
| `public/quest-icons/gem-cyan.png` | 96x96 | `TownScene.ts` decor (WIRED) |
| `public/quest-icons/gem-orange.png` | 96x96 | `TownScene.ts` decor (WIRED) |
| `public/quest-icons/gem-teal.png` | 96x96 | unused — reserve as a 3rd quest-item variant if/when quest-pickup logic ships |

## UI icons

| Path | Dims | Wire-in target |
|---|---|---|
| `public/item-icons/*.png` (~60 files: weapon/armor/trinket/potion tiers) | 48x48 / 128x128 | `equipment.ts:238` → shop/inventory UI (WIRED) |
| `public/skill-icons/*.png` (24 files) | 48x48 | `skills.ts` / `SkillTreeModal.vue:16` (WIRED) |
| `public/character-icons/*.png` | ~150x150 | class picker / battle UI (WIRED, see Four classes above) |
| `public/ui-pack/{char_frame,daynight_dawn,daynight_day,daynight_dusk,daynight_night}.png` | 44–48px | **confirmed UNWIRED** (zero refs in `app/`, grep-verified) — available for HUD reuse in Phase 14 |

## VFX

| Path | Dims | Wire-in target |
|---|---|---|
| `public/skill-icons/fire.png`, `ice.png`, `lightning.png` | 48x48 | skill tree UI only (WIRED) — not combat-world VFX |
| `public/mob-sprites/world-boss/world01_idle.png` | 640x160 (5 frames) | `BossScene.ts` (WIRED) — only in-world sprite animation |

## Audio

| Path | Dims | Wire-in target |
|---|---|---|
| `public/audio/bgm_forest.mp3` | n/a | `bgm.ts` `bgmKeyForBiome('forest')` → `TowerScene.ts`/`BossScene.ts` (WIRED) |
| `public/audio/bgm_town.mp3` | n/a | `bgm.ts` → `TownScene.ts` (WIRED) |
