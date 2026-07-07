# S_GRADE_VISUAL_REVIEW

Art-director review of the game **as rendered** (live preview, boss floor 10 + town). Rated against a
commercial top-down pixel RPG bar.

## Current grade: **C+ → B−** (was C before boss upgrade)

### What now works (keep)
- **Bosses (A).** Animated, escalating, coherent craftpix creatures with arena staging. Reads as a real
  RPG boss encounter. ✅ shipped this pass.
- **Player + class overlay (B+).** 4-direction walk/idle, layered equipment silhouettes.
- **UI shell (B+).** Title art, HUD bar, glass/pixel theme are cohesive and on-brand.
- **Regular monsters (B).** Real animated sprites, readable silhouettes.

### What holds it back (ranked)
1. **Flat ground field (biggest).** A single tinted tile tiled across the whole map reads as a
   billiard table. Kills the "alive world" feel. → `craftpix-504452` variation. *(MAP_ASSET_USAGE #1)*
2. **Placeholder walls & stairs.** Graphics rectangles betray the prototype. → real tileset. *(#1,#3)*
3. **Trees are flat tinted stamps, no shadow** → foliage pack w/ shadows. *(#2)*
4. **3 town buildings still Graphics-drawn** (hospital/equipment/gate) → chapel/guild/village. *(#4)*
5. **No depth/atmosphere layer.** No vignette, no ambient props, no biome-specific palette beyond the
   wash. Adding scattered rocks/ruins + a subtle vignette would lift composition.
6. **Uniform monster spawns** across all biomes (variety/repetition problem). *(MONSTER_BOSS #regular)*
7. **No BGM/ambience.** `BGM集Vol.1` maps cleanly to biomes (神殿/火山/森) — big atmosphere ROI.

## Path to S-grade (in order)
| # | Change | Effort | Visual ROI |
|---|---|---|---|
| 1 | Village tileset ground variation + walls | M | ★★★★★ |
| 2 | Shadowed trees/bushes | S | ★★★★ |
| 3 | Real stairs + finish town buildings | M | ★★★★ |
| 4 | Biome-aware spawn tables + slime recolors | M | ★★★ |
| 5 | Laid paths (road tileset) in town | S | ★★★ |
| 6 | Ruins landmarks on high floors + boss arena framing | M | ★★★ |
| 7 | BGM per biome + torch/flag VFX | S | ★★★ |
| 8 | Full 4-dir combat anims (attack/hurt/death) for player | L | ★★ |

Delivering 1–3 moves the game solidly into **A−**; 1–7 reaches **S**.
