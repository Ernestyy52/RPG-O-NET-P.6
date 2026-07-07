# MISSING_OR_WEAK_ASSETS

Gaps between what the game needs for S-grade and what `D:\Asset` provides.

## Weak assets still visible in-game (replace)
| Asset | Problem | Fix (available in library) |
|---|---|---|
| Ground tile (flat wash) | one tile repeated → dead field | `craftpix-504452` grass/dirt variants |
| Border walls (Graphics) | placeholder rectangles | `craftpix-504452` walls/fences OR `craftpix-169442` dungeon walls |
| Trees (tinted stamp) | flat, no shadow | `craftpix-141354` bushes (+shadow layer) |
| Stairs (gold rect) | placeholder | dungeon door/stair tile |
| Hospital / Equipment shop / Dungeon gate (Graphics) | drawn primitives | `craftpix-477438` chapel / `craftpix-218281` pedestal-arch / village stall |
| Outfit & accessory equipment layers (colored placeholder silhouettes) | not real gear art | needs real layered gear — see gap below |

## Genuine gaps (no ideal asset in library)
1. **Layered *equipment* sprites that match the overworld body frame-for-frame.** The library has full
   *character* sheets (craftpix 4-dir) but not detachable armor/outfit overlays aligned to
   `player-sprites/overworld/*`. Options: (a) switch the player to craftpix 4-dir base + its own gear
   variants, or (b) keep tinted-silhouette placeholders (current). No drop-in fix — flagged, not forced.
2. **Regular monster variety per biome.** Have: goblin/skeleton/slime + boss creatures. Missing: distinct
   low-tier mobs for 5 biomes. Partial fill: `craftpix-788364` slime recolors, `craftpix-363992` orcs,
   plus using boss creatures' *walk* frames as elite mobs. Still short of 5× unique rosters.
3. **Town NPCs.** `Free Character Sprites - Fantasy Dreamland` (120 small chars) can fill shopkeeper/
   questgiver, but they're a different style from the craftpix hero — acceptable at small size, note the
   mild mismatch.
4. **Tower interior tilesets for a true "climbing a tower" feel.** Dungeon packs exist (169442, Pixel
   Crawler) but no purpose-built vertical-tower art; would be assembled, not dropped in.
5. **Projectile/impact VFX tuned to skills.** `Effect and Bullet 16x16` + `skill_effects.png` cover basics;
   no per-element (fire/ice/holy) set matching the O-NET skill list — would need recolor.

## Not needed / explicitly skipped
- Sci-fi RTS, urban pack, pico-8 city, ski/farm Kenney packs — off-theme.
- Creating brand-new art — directive says prefer fixing/reusing; every gap above has a reuse path except
  #1 (equipment layers), which is a design decision to escalate, not an asset to generate blindly.
