import { describe, it, expect } from 'vitest'
import {
  DUNGEON_LAYOUT_IDS,
  getDungeonLayout,
  buildCollisionMap,
  reachableTiles,
  layoutReachability,
  isBlocked,
  type DungeonLayoutConfig,
} from '~/game/runtime'

// ================================================================================================
// Phase 14 Inc 2 — dungeon layout data + collision.
// The reachability tests are the structural proof of the Gate criterion "no soft lock": from the
// entry tile, the exit, boss gate, both elites, and every secret must be reachable on foot. A layout
// that seals any objective fails CI here, before it can ever reach a playthrough.
// ================================================================================================

const ALL = DUNGEON_LAYOUT_IDS.map(getDungeonLayout)

function inBounds(c: DungeonLayoutConfig, x: number, y: number) {
  return x >= 0 && y >= 0 && x < c.cols && y < c.rows
}

describe('dungeon layouts — structure', () => {
  it('exposes exactly the two World-1 layouts', () => {
    expect(DUNGEON_LAYOUT_IDS).toEqual(['world01-mini', 'world01-main'])
  })

  it('grids match declared dimensions ([row][col])', () => {
    for (const c of ALL) {
      expect(c.floorGrid.length).toBe(c.rows)
      expect(c.wallGrid.length).toBe(c.rows)
      for (let y = 0; y < c.rows; y++) {
        expect(c.floorGrid[y].length).toBe(c.cols)
        expect(c.wallGrid[y].length).toBe(c.cols)
      }
    }
  })

  it('has a full border wall ring on every layout', () => {
    for (const c of ALL) {
      for (let x = 0; x < c.cols; x++) {
        expect(c.wallGrid[0][x]).not.toBeNull()
        expect(c.wallGrid[c.rows - 1][x]).not.toBeNull()
      }
      for (let y = 0; y < c.rows; y++) {
        expect(c.wallGrid[y][0]).not.toBeNull()
        expect(c.wallGrid[y][c.cols - 1]).not.toBeNull()
      }
    }
  })

  it('all key tiles are inside bounds and on walkable floor', () => {
    for (const c of ALL) {
      const keys = [c.entry, c.exit, ...(c.bossGate ? [c.bossGate] : []),
        ...c.elites.map((e) => e.at), ...c.secrets.map((s) => s.at)]
      for (const t of keys) {
        expect(inBounds(c, t.x, t.y)).toBe(true)
        expect(isBlocked(c, t.x, t.y)).toBe(false)
      }
    }
  })
})

describe('dungeon layouts — collision map', () => {
  it('marks border as blocked and interior floor as open', () => {
    for (const c of ALL) {
      const map = buildCollisionMap(c)
      expect(map[0][0]).toBe(true)
      // entry is open
      expect(map[c.entry.y][c.entry.x]).toBe(false)
    }
  })

  it('blocking props contribute to collision', () => {
    for (const c of ALL) {
      const map = buildCollisionMap(c)
      for (const p of c.props) {
        if (p.blocking) expect(map[p.y][p.x]).toBe(true)
      }
    }
  })
})

describe('dungeon layouts — reachability (no soft lock)', () => {
  it('every objective tile is reachable from the entry', () => {
    for (const c of ALL) {
      const report = layoutReachability(c)
      expect(report.entryWalkable).toBe(true)
      expect(report.unreachable, `${c.id} unreachable: ${JSON.stringify(report.unreachable)}`).toEqual([])
      expect(report.ok).toBe(true)
    }
  })

  it('a large connected floor region exists from the entry (not a 1-tile pocket)', () => {
    for (const c of ALL) {
      const reachable = reachableTiles(c, c.entry)
      const interior = (c.cols - 2) * (c.rows - 2)
      // at least half the interior is walkable & connected to the entry
      expect(reachable.size).toBeGreaterThan(interior * 0.5)
    }
  })

  it('world01-main has a boss gate and 2 elites; world01-mini has neither', () => {
    const mini = getDungeonLayout('world01-mini')
    const main = getDungeonLayout('world01-main')
    expect(mini.bossGate).toBeUndefined()
    expect(mini.elites.length).toBe(0)
    expect(main.bossGate).toBeDefined()
    expect(main.elites.length).toBe(2)
    expect(main.secrets.length).toBeGreaterThanOrEqual(2)
  })
})
