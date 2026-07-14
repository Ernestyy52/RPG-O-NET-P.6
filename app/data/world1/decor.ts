// ================================================================================================
// World 1 — dungeon foliage decor (Phase 14 Inc 4)
//
// Verdant flower bushes (Craftpix top-down bushes, curated into public/world1-props/) scattered through
// the World-1 dungeons for life + a non-placeholder look. Decor is purely visual: the scene renders it
// depth-sorted with NO physics body, so it's safe on any walkable floor tile (you walk over/behind it).
// The tile choice is a PURE, deterministic function of the layout so it's unit-testable and never lands
// on a wall or an interactive tile.
// ================================================================================================
import { mulberry32 } from '~/data/learning/rng'

export interface BushDecor { key: string; sprite: string; w: number; h: number }

/** Curated foliage (relative paths, no leading slash — loaded via assetPath()). */
export const WORLD1_BUSHES: BushDecor[] = [
  { key: 'w1bush_green', sprite: 'world1-props/bush_green.png', w: 32, h: 32 },
  { key: 'w1bush_pink', sprite: 'world1-props/bush_pink.png', w: 64, h: 64 },
  { key: 'w1bush_blue', sprite: 'world1-props/bush_blue.png', w: 64, h: 64 },
  { key: 'w1bush_orange', sprite: 'world1-props/bush_orange.png', w: 32, h: 32 },
  { key: 'w1bush_red', sprite: 'world1-props/bush_red.png', w: 32, h: 32 },
]

/**
 * Dungeon props (Craftpix dungeon pack) — barrels/crates/pottery to dress the World-1 dungeons. Same
 * placement contract as bushes: non-blocking + depth-sorted on walkable floor, so they never affect the
 * layout's proven reachability (they are NOT added to wallGrid).
 */
export const WORLD1_DUNGEON_PROPS: BushDecor[] = [
  { key: 'w1prop_barrel', sprite: 'world1-props/prop_barrel.png', w: 17, h: 30 },
  { key: 'w1prop_crate', sprite: 'world1-props/prop_crate.png', w: 32, h: 31 },
  { key: 'w1prop_vase', sprite: 'world1-props/prop_vase.png', w: 16, h: 25 },
]

export interface DecorTile { x: number; y: number; bush: number }

/**
 * Deterministically choose up to `count` FLOOR tiles (wallGrid[y][x] === null) to decorate, excluding the
 * `reserved` set (entry/exit/boss gate/secrets/elites) and the outer border, and assign a bush index to
 * each. Same wallGrid + reserved + count + seed ⇒ same result.
 */
export function pickDecorTiles(
  wallGrid: (number | null)[][],
  reserved: { x: number; y: number }[],
  count: number,
  seed: number,
): DecorTile[] {
  const rows = wallGrid.length
  const cols = wallGrid[0]?.length ?? 0
  const blocked = new Set(reserved.map((t) => `${t.x},${t.y}`))
  const candidates: { x: number; y: number }[] = []
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (wallGrid[y][x] === null && !blocked.has(`${x},${y}`)) candidates.push({ x, y })
    }
  }
  const rng = mulberry32(seed)
  // deterministic partial Fisher–Yates shuffle, then take the first `count`
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }
  return candidates.slice(0, Math.max(0, count)).map((t) => ({ x: t.x, y: t.y, bush: Math.floor(rng() * WORLD1_BUSHES.length) }))
}
