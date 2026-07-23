// Generic zone validator (Map Build Phase 0 gate): spawn→objective→exit reachability + spawn-region
// capacity/safe-pocket proofs, on ANY map shape — verified here on synthetic grids and on the real
// dungeon layouts (which now delegate to this validator).
import { describe, it, expect } from 'vitest'
import {
  gridFromCollision, reachableFrom, validateZoneReachability, validateSpawnRegion,
} from '~/game/runtime/zoneValidate'
import { DUNGEON_LAYOUT_IDS, getDungeonLayout, buildCollisionMap } from '~/game/runtime/dungeonLayouts'

/** Tiny map builder: '#' = blocked, '.' = walkable. */
function grid(rows: string[]) {
  return gridFromCollision(rows.map((r) => [...r].map((c) => c === '#')))
}

describe('zone validator — reachability', () => {
  it('proves entry → objective → exit on an open map', () => {
    const g = grid([
      '#####',
      '#...#',
      '#...#',
      '#####',
    ])
    const report = validateZoneReachability(g, { x: 1, y: 1 }, [
      { label: 'objective', at: { x: 3, y: 1 } },
      { label: 'exit', at: { x: 3, y: 2 } },
    ])
    expect(report.ok).toBe(true)
    expect(report.unreachable).toEqual([])
  })

  it('detects a sealed objective (soft-lock) and names it', () => {
    const g = grid([
      '######',
      '#..#.#',
      '#..#.#',
      '######',
    ])
    const report = validateZoneReachability(g, { x: 1, y: 1 }, [
      { label: 'sealed-chest', at: { x: 4, y: 1 } },
    ])
    expect(report.ok).toBe(false)
    expect(report.unreachable.map((u) => u.label)).toEqual(['sealed-chest'])
  })

  it('fails when the entry itself is blocked or out of bounds', () => {
    const g = grid(['###', '#.#', '###'])
    expect(validateZoneReachability(g, { x: 0, y: 0 }, []).entryWalkable).toBe(false)
    expect(validateZoneReachability(g, { x: 9, y: 9 }, []).entryWalkable).toBe(false)
    expect(reachableFrom(g, { x: 0, y: 0 }).size).toBe(0)
  })
})

describe('zone validator — spawn regions', () => {
  const g = grid([
    '#######',
    '#.....#',
    '#.....#',
    '#.....#',
    '#######',
  ])

  it('accepts a region with enough walkable tiles', () => {
    const report = validateSpawnRegion(g, { minX: 1, maxX: 5, minY: 1, maxY: 3 }, 5)
    expect(report.ok).toBe(true)
    expect(report.usableTiles).toBe(15)
  })

  it('rejects a region whose population cannot fit', () => {
    const report = validateSpawnRegion(g, { minX: 1, maxX: 2, minY: 1, maxY: 1 }, 5)
    expect(report.ok).toBe(false)
    expect(report.problems[0]).toMatch(/2 walkable tiles for 5 spawns/)
  })

  it('excludes safe pockets — learning feedback space never hosts spawns', () => {
    const whole = { minX: 1, maxX: 5, minY: 1, maxY: 3 }
    const safe = { minX: 1, maxX: 5, minY: 1, maxY: 3 } // safe pocket covers everything
    const report = validateSpawnRegion(g, whole, 1, [safe])
    expect(report.ok).toBe(false)
    expect(report.usableTiles).toBe(0)
  })
})

describe('zone validator — real dungeon layouts route through the generic proof', () => {
  it('every shipped layout passes reachability and spawn capacity via zoneValidate', () => {
    for (const id of DUNGEON_LAYOUT_IDS) {
      const config = getDungeonLayout(id)
      const g = gridFromCollision(buildCollisionMap(config))
      const report = validateZoneReachability(g, config.entry, [
        { label: 'exit', at: config.exit },
        ...config.secrets.map((s) => ({ label: s.id, at: s.at })),
      ])
      expect(report.ok, `${id} reachability`).toBe(true)
      for (const s of config.spawns) {
        expect(validateSpawnRegion(g, s.bounds, s.count).ok, `${id} spawn ${s.slug}`).toBe(true)
      }
    }
  })
})
