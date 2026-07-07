# ASSET_QUALITY_REPORT

Quality assessment of `D:\Asset` for this game's needs (top-down, 32px, craftpix-leaning style).

## Headline findings
- **Style coherence is excellent** *if* you stay in the craftpix family (characters, monsters, bosses,
  village, bushes, ruins, dungeon, chapel, guild). Mixing Kenney tiles or Sunnyside piecemeal would
  break palette/outline consistency — flagged, not done.
- **Transparency/crop quality: high** across craftpix + Kenney PNGs. Craftpix creature frames use a
  fixed per-creature canvas (good — stable pivots for animation; do NOT per-frame trim).
- **Resolution mismatch is the main risk.** Native grid is 32px. Monster/boss frames are 128–256px
  (scale down fine under `pixelArt:true`); Sunnyside/Kenney farm are 16px (scale *up* → keep integer
  scales only); pico-8 is 8px (unusable). Avoid non-integer upscales.

## Per-family quality
| Family | Crop | Transparency | Scale fit | Anim completeness | Verdict |
|---|---|---|---|---|---|
| craftpix monsters/bosses (561178) | ✅ clean | ✅ | scale-down OK | idle/walk/attack/hurt/death per creature | **S** |
| craftpix 4-dir characters (555940/419402) | ✅ | ✅ | 128px → scale | full states, 4-dir | **A** |
| craftpix village tileset (504452) | ✅ | ✅ | **native 32** | autotile + animated objects | **S** |
| craftpix foliage/ruins (141354/934618) | ✅ (+shadow layers) | ✅ | 32/64 native-ish | static | **A** |
| Kenney UI (ui-pack, borders) | ✅ | ✅ | vector+raster | n/a | **S** (UI only) |
| Sunnyside V2.1 | ✅ | ✅ | 16px, complex | rich | **S style / high effort** |
| Kenney medieval-rts / pico-8 city | ✅ | ✅ | iso / 8px | n/a | **C** (off-fit) |

## Data-quality caveats found during scan
- Fast PNG-header parser reports `0×0` / `W×0` on a subset of craftpix single-frame files — **not a real
  asset defect**, a parser limitation; `System.Drawing` gives correct sizes. Documented in the index.
- `__MACOSX/`, `.DS_Store`, `COUPON.*`, `.url`, license, `.psd`, `.aseprite` files are noise — excluded.
- Duplicate pack: `craftpix-169442-…dungeon` and `free-2d-top-down-pixel-dungeon-asset-pack` are identical
  (both 23 files, same dims) → use one, ignore the other.
