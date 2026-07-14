import { describe, it, expect } from 'vitest'
import { WORLD1_BUSHES, WORLD1_DUNGEON_PROPS, pickDecorTiles } from '~/data/world1/decor'
import { getDungeonLayout } from '~/game/runtime/dungeonLayouts'

// ================================================================================================
// Phase 14 Inc 4 — dungeon foliage decor: tiles are always walkable, never reserved, deterministic.
// ================================================================================================

// a small grid: border walls (0), interior floor (null), one interior wall
const grid: (number | null)[][] = [
  [0, 0, 0, 0, 0],
  [0, null, null, null, 0],
  [0, null, 0, null, 0],
  [0, null, null, null, 0],
  [0, 0, 0, 0, 0],
]

describe('World-1 decor — bush catalog', () => {
  it('has bushes + dungeon props with relative (subpath-safe) sprite paths, positive sizes, unique keys', () => {
    const all = [...WORLD1_BUSHES, ...WORLD1_DUNGEON_PROPS]
    expect(WORLD1_BUSHES.length).toBeGreaterThan(0)
    expect(WORLD1_DUNGEON_PROPS.length).toBeGreaterThan(0)
    for (const b of all) {
      expect(b.sprite.startsWith('/')).toBe(false)
      expect(b.sprite).toMatch(/^world1-props\/.+\.png$/)
      expect(b.w).toBeGreaterThan(0)
      expect(b.h).toBeGreaterThan(0)
    }
    expect(new Set(all.map((b) => b.key)).size).toBe(all.length) // no key collisions bush↔prop
  })
})

describe('World-1 decor — pickDecorTiles', () => {
  it('only ever returns walkable, non-reserved, in-bounds tiles', () => {
    const reserved = [{ x: 1, y: 1 }]
    const tiles = pickDecorTiles(grid, reserved, 10, 42)
    for (const t of tiles) {
      expect(grid[t.y][t.x]).toBeNull()               // walkable floor
      expect(`${t.x},${t.y}`).not.toBe('1,1')         // not the reserved tile
      expect(t.x).toBeGreaterThan(0)
      expect(t.y).toBeGreaterThan(0)
      expect(t.bush).toBeGreaterThanOrEqual(0)
      expect(t.bush).toBeLessThan(WORLD1_BUSHES.length)
    }
    // the interior wall at (2,2) is never chosen
    expect(tiles.some((t) => t.x === 2 && t.y === 2)).toBe(false)
  })

  it('caps at the requested count and is deterministic per seed', () => {
    expect(pickDecorTiles(grid, [], 3, 7).length).toBeLessThanOrEqual(3)
    expect(pickDecorTiles(grid, [], 5, 7)).toEqual(pickDecorTiles(grid, [], 5, 7))
  })

  it('produces decor for the real World-1 layouts without hitting walls', () => {
    for (const id of ['world01-mini', 'world01-main'] as const) {
      const layout = getDungeonLayout(id)
      const reserved = [layout.entry, layout.exit, ...layout.secrets.map((s) => s.at), ...layout.elites.map((e) => e.at)]
      if (layout.bossGate) reserved.push(layout.bossGate)
      const tiles = pickDecorTiles(layout.wallGrid, reserved, 7, 123)
      expect(tiles.length).toBeGreaterThan(0)
      for (const t of tiles) expect(layout.wallGrid[t.y][t.x]).toBeNull()
    }
  })
})
