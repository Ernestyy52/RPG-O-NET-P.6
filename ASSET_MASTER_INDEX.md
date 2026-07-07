# ASSET_MASTER_INDEX

Machine-scanned catalog of `D:\Asset` — **14,449 PNG files** across 41 packs, with exact pixel
dimensions read from PNG/IHDR headers (`scripts/sprite-crop/scan-assets.ps1`, raw data in
`scratchpad/asset-scan.csv`). This is the single source of truth for asset selection.

> Note on `0×0` / `WxH=…0` rows in raw scans: the fast header parser mis-reads a minority of
> frame PNGs (e.g. craftpix individual-frame files). Where a decision depended on it, dimensions
> were re-confirmed with `System.Drawing` (authoritative). Example: craftpix dragon frames report
> `0×0` in the fast scan but are truly **256×256**.

Legend — **Grade**: S (production-ready, drop-in) · A (great, minor prep) · B (usable, needs
slicing/cleanup) · C (niche/low-fit). **Status**: ✅ in game · 🔜 queued · ⭐ recommended next · — unused.

---

## Characters / Player / NPC

| Pack | n | Frame size | Category | Grade | Best use | Status |
|---|---|---|---|---|---|---|
| `Main Character Asset` | 2484 | 32×32 (776), 128×128 portraits, 16×16 icons | base body, occupation layers, UI icons, portraits | A | Player base + 8 class overlays (already cropped by `build-all.cjs` → `assets/characters/`); huge icon set for inventory/shop UI | ✅ (base+class), 🔜 icons |
| `craftpix-555940` male 4-dir | 175 | 128-wide strips (Sword idle/attack/hurt/death, 4-dir) | player body, equip layers | A | 4-direction male hero with real attack/hurt/death anims — upgrade path for full combat animation | ⭐ |
| `craftpix-419402` female 4-dir | 158 | 64/128/192-wide strips | player body, equip layers | A | Female counterpart to above | ⭐ |
| `craftpix-363992` orc character | 336 | 128-wide, layered (body/head/weapon) | NPC / elite monster | A | Layered orc (attack/run/death) — great as a mini-boss or town guard NPC | 🔜 |
| `Free Character Sprites - Fantasy Dreamland` | 120 | 16×16, 144×192 sheets | NPC (townsfolk) | B | Small charming NPCs for town (shopkeeper, questgiver ambiance) | ⭐ town |
| `kenney_roguelike-characters` | 4 | 150×203 sheet | NPC/monster atlas | B | Fallback character atlas (magenta+transparent) | — |

## Monsters / Bosses

| Pack | n | Frame size | Category | Grade | Best use | Status |
|---|---|---|---|---|---|---|
| `craftpix-561178` monster pack | 154 | **256×256** (dragon/demon), **128×128** (medusa/small_dragon/jinn/lizard) | boss | **S** | Boss rotation. Frame-by-frame idle/walk/attack/hurt/death per creature | ✅ (idle strips built for dragon/demon/medusa/small_dragon) |
| `craftpix-788364` slime mobs | 159 | 128-wide strips | monster (regular) | A | Biome slime variants w/ attack+death — upgrade the flat `slime-idle` | ⭐ |
| `craftpix-363992` orc | 336 | 128-wide layered | monster (elite) | A | See above — elite/mini-boss | 🔜 |
| current `public/mob-sprites/*` | — | 32/64px | monster (regular) | B | goblin(orc)/skeleton/slime idles in active use | ✅ |

## Tilesets / Terrain / Environment

| Pack | n | Frame size | Category | Grade | Best use | Status |
|---|---|---|---|---|---|---|
| `craftpix-504452` village tileset | 187 | **32×32** (128 tiles) | terrain, building, autotile | **S** | **Exact `TILE=32` match.** Ground/path/water autotiles + fences + animated objects for Town + grass biomes | ⭐⭐ (top map priority) |
| `craftpix-574220` path & road | 17 | 240×160 / 240×224 sheets | path/road autotile | A | Slice → road/path transitions between town zones | ⭐ |
| `craftpix-141354` top-down bushes | 165 | 32×32, 64×64, 16×16 (+shadow variants) | tree/plant prop | A | Layered bushes w/ real drop-shadows → replace tinted tree tile | ⭐ |
| `craftpix-934618` ruins | 165 | 32/48/64/80/112 | nature/dungeon prop | A | Broken pillars/statues for high-floor "ruined tower" biomes & boss arenas | 🔜 |
| `craftpix-169442` / `free-2d-top-down-pixel-dungeon` | 23 | 96×192 walls, sheets | dungeon tile, autotile | A | Dungeon floors/walls/doors for interior tower levels | ⭐ |
| `Pixel Crawler - Free Pack 2.1` | 178 | 128×64/128×32 sheets | dungeon tile, props, mockups | A | Cohesive dungeon set (floors/walls/props) + tavern mockups for reference | 🔜 |
| `Sunnyside_World_ASSET_PACK_V2.1` | 5835 | 16px master + 96×64 anim slices | terrain, building, char, prop | S(style) | Gorgeous cohesive overworld — but 16px & complex; high effort. Use master tileset `spr_tileset_sunnysideworld_16px.png` if committing to a full restyle | — (big bet) |
| `craftpix-477438` chapel | 240 | 96×96/128×128/144×128 | building, dungeon prop | A | Chapel/shrine building for a "sanctuary" town or boss antechamber | 🔜 |
| `craftpix-189780` guild hall | 101 | 128×128/192×208 | building interior | A | Guild-hall interior (already partly used via `guildhall-props/`) | ✅ partial |
| `craftpix-218281` dungeon objects | 15 | 80×160/240×128 sheets | dungeon prop, trap | A | Fire traps, pedestals, supplies → danger-zone dressing | ⭐ |
| `Top-Down_Retro_Interior` | 6 | 208×32 sheets | building interior | B | Shop/house interiors | 🔜 |
| `kenney_tiny-farm` | 136 | 16×16 | terrain, prop | B | Farm/grass filler (style differs from craftpix) | — |
| `kenney_medieval-rts` | 259 | 64×64 / 128×128 | building | B | Isometric-leaning RTS buildings — style mismatch for top-down | C |
| `kenney_rpg-urban-pack` | 490 | 16×16 | urban tile | C | Modern city — off-theme | — |
| `Dungeon_Tileset.png`, `tileset_dungeon.png`, `Dungeon tileset/` | 3 | 128×192 / 160w | dungeon tile | B | Small dungeon tilesets, quick option | — |
| `Pixel Plains Free Pack` | 3 | 192×112 sheets | terrain | B | Basic plains tiles + trees/bushes | — |
| `SuperRetroRanch` / `SuperRetroWorld` | 730 | 16×16 / 32×32 atlases | terrain, prop | B | Retro farm/market atlases | — |
| `kenney_pico-8-city` | 364 | 8×8 | tile | C | Too low-res for this game | — |

## UI / HUD / Icons

| Pack | n | Frame size | Category | Grade | Best use | Status |
|---|---|---|---|---|---|---|
| `kenney_ui-pack` | 870 | 64/128/32/16 | UI panel, button, cursor | S | HUD panels, buttons (has fonts + sounds) | 🔜 |
| `kenney_fantasy-ui-borders` | 282 | 48×48 / 96×96 | UI border/panel (9-slice) | S | Pixel window borders for shop/battle dialogs | ⭐ |
| `kenney_ui-pack-rpg-expansion` | 90 | small | UI arrows/icons | A | Inventory arrows, tier chevrons | 🔜 |
| `kenney_ui-pack-adventure` | 260 | 64/128/32/16 | UI panel/banner | A | Title banners, scrolls | 🔜 |
| `UI Assets pack_v.1_st` | 4 | Book/Interface/UI sheets | UI atlas | B | Book/quest-log frame | 🔜 |
| `Main Character Asset/icons` | ~221 | 16×16 | UI icon | A | Action icons (back/close/confirm…) | ⭐ |

## Effects / VFX / Audio

| Pack | n | Frame size | Category | Grade | Best use | Status |
|---|---|---|---|---|---|---|
| `Effect and Bullet 16x16` | 4 | 64×208 sheets | VFX (fire/green/purple/water) | A | Attack/impact bullets, boss fire breath | 🔜 |
| `public/skill-assets/skill_effects.png` | 1 | large sheet | VFX | A | Skill impact frames (already shipped) | ✅ |
| `craftpix-189780/ASEPRITE/Fire, Flags` | — | animated | VFX | A | Torch fire / arena flags | 🔜 |
| `ゲーム制作…BGM集Vol.1` | 41 mp3 | audio | BGM | A | Biome/boss music (神殿/火山/森 tracks map cleanly to biomes) | ⭐ audio |

---

## Cross-cutting notes
- **Style spine = craftpix top-down.** The player, monsters, bosses, village tileset, bushes, ruins,
  dungeon, chapel, and guild packs are all craftpix and share palette/outline conventions → pick these
  first for coherence. Kenney packs are fallback/UI only; Sunnyside is a separate (beautiful) universe —
  don't mix piecemeal.
- **32px is the native grid** (`TILE=32`). Prefer the 32×32 village tileset and 32/64px props; the
  128/256px monster frames are scaled down at runtime (`pixelArt:true` keeps them crisp).
- Every `COUPON.*`, `.url`, `.DS_Store`, `__MACOSX`, license, and `.psd/.aseprite` source file is
  metadata, not a game asset — excluded from placement.
