# MONSTER_BOSS_PLACEMENT

## Boss system (IMPLEMENTED this pass ✅)

**Before:** every boss floor used `dragon.png` — a 963-byte static image scaled to 0.6. Tiny, flat,
identical on every boss floor. The single weakest asset in the game.

**After:** an escalating, animated boss rotation sourced from `craftpix-561178` (S-grade), stitched
into Phaser spritesheets by `scripts/sprite-crop/build-bosses.cjs` → `public/mob-sprites/boss_*.png`.

| Boss floor (÷10) | Creature | Frame | On-screen | Menace |
|---|---|---|---|---|
| 10, 50, 90 … | `small_dragon` | 128×128 ×3 idle | ~132px | starter wyrmling |
| 20, 60, 100 … | `medusa` | 128×128 ×3 idle | ~136px | mid |
| 30, 70 … | `demon` | 256×256 ×3 idle | ~208px | high |
| 40, 80 … | `dragon` | 256×256 ×3 idle | ~224px | apex |

- Rotation logic: `bossVisualForFloor(floor)` in `app/game/systems/textures.ts` — index =
  `(floor/10 − 1) mod 4`, so bosses cycle and visibly escalate within each 40-floor arc.
- **Arena staging:** boss gets a scaled drop-shadow, an idle animation, and a slow vertical float
  tween (`Sine.easeInOut`, 1.6s) so it hovers menacingly instead of sitting on the grass.
- Physics body shrunk to ~50%×40% of the frame so the large sprite doesn't trigger encounters from
  its transparent margins.
- Locked state unchanged: when `describeMissingRequirements()` isn't satisfied the `boss_door_locked`
  texture is shown (pre-existing gameplay gate, verified still working).
- **Verified in preview** (floor 10, `__game` debug handle): all 4 spritesheets load, correct frame
  sizes, animations registered & playing, crisp render, correct transparency — see session screenshot.

Walk strips (`boss_*_walk.png`) are also built and shipped, ready for a future pacing/charging boss AI.

## Regular monsters (current + recommended)

| In game now | Source | Biome fit | Recommendation |
|---|---|---|---|
| goblin (`orc-idle`) | existing 32px | forest/plains | keep; add orc *elite* from `craftpix-363992` on floors 25+ |
| skeleton | existing 32px | crypt/ruins | keep |
| slime | existing 64px | all | ⭐ upgrade to `craftpix-788364` (recolor per biome: green/blue/red slimes) |

Monsters currently spawn at random tiles (`Phaser.Math.Between`). **Roadmap:** biome-aware spawn tables
(`app/data/biomes.ts`) so lizards/medusa-kin appear in volcano floors, skeletons in crypt floors, etc.,
instead of the same 3 everywhere — see `MISSING_OR_WEAK_ASSETS.md`.
