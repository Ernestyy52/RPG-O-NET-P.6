# MAP_ASSET_USAGE

How the two scenes currently dress their maps, and the specific indexed assets that should replace the
hand-drawn Phaser Graphics. Grid is `TILE=32`; TowerScene = 24×18, TownScene = 26×19.

## Current usage (as of this pass)

| Element | Current source | Verdict |
|---|---|---|
| Ground | `tiny-town` frame 0, colour-washed per biome (`bakeFrame`) | ⚠️ **one flat tile repeated** — biggest readability weakness; no variation |
| Walls (border) | Phaser Graphics rectangle + 4 stroked quads (`buildWall`) | ⚠️ placeholder look |
| Trees | `tiny-town` frame 28, colour-washed | ⚠️ single tinted tile, no shadow |
| Stairs | Graphics gold rectangle (`buildStairs`) | ⚠️ placeholder |
| Shadow blob | canvas radial gradient | ✅ fine (reusable) |
| Town buildings | `guild_hall_exterior.png` (real, tiny), `shop_stall.png` (real); hospital / equipment shop / dungeon gate = Graphics | ◐ mixed; 2 real, 3 drawn |
| Town decor | `torch.png`, `gem-cyan/orange.png` | ✅ real, small |
| Boss | `boss_*_idle` animated | ✅ upgraded this pass |
| Player | `player-sprites/overworld/*` + layered equipment | ✅ real |

## Recommended swaps (priority order, all craftpix for style coherence)

1. **Ground variation + real walls — `craftpix-504452` (32×32, S-grade, exact grid).** Load its tileset,
   pick 3–4 grass/dirt variants per biome and scatter with weighted randomness (breaks the flat field);
   use its wall/fence tiles for borders. Keep the per-biome colour-wash trick for biome identity.
   *Biggest single visual win — do first.*
2. **Trees/bushes — `craftpix-141354`** (has matching `Assets_shadow` variants) → drop-shadowed foliage
   replacing the tinted `tiny-town` tile. Cluster near map edges, not on walkable paths.
3. **Stairs — `craftpix-169442` dungeon** door/stair tile, or village-tileset stone steps.
4. **Town buildings — finish the set:** `craftpix-477438` chapel → Hospital/Sanctuary; `craftpix-189780`
   guild hall exterior (already have interior props) → Guild; village-tileset market stall → Item Shop;
   `craftpix-218281` pedestal/arch → dungeon gate. Removes the last 3 Graphics buildings.
5. **Paths — `craftpix-574220`** road tiles to connect town buildings with laid paths (guides the eye,
   defines safe-zone vs walkable).
6. **High-floor "ruined tower" biomes — `craftpix-934618` ruins** (broken pillars/statues) as
   non-walkable landmarks + boss-arena framing.

## Placement rules honoured
- Trees/props only at non-path tiles; collision bodies kept to the trunk/base (as existing tree code does).
- Decoration density stays low — readability over clutter (per directive).
- Danger-zone dressing (traps, bones) reserved for monster floors; reward props (chests) for post-clear.
