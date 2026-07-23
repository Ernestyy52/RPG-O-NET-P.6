// ================================================================================================
// Floor variety (S-grade gameplay pass) — seeded layouts must be deterministic and soft-lock-proof
// by construction; modifiers must respect pacing rules (town/milestone floors stay vanilla).
// ================================================================================================
import { describe, it, expect } from 'vitest'
import {
  FLOOR_VARIETY_ENABLED, DEFAULT_GRID, floorObstacles, floorModifier, FLOOR_MODIFIERS,
  chestSpots, chestReward, floorDecorSpots, BIOME_BUSHES,
} from '~/data/floorFeatures'
import { BIOMES } from '~/data/biomes'
import { WORLD1_BUSHES } from '~/data/world1/decor'

const cheb = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))

describe('floor variety — obstacles', () => {
  it('flag is on (per-floor layouts live)', () => {
    expect(FLOOR_VARIETY_ENABLED).toBe(true)
  })

  it('is deterministic per floor and differs across floors', () => {
    const a1 = floorObstacles(7)
    const a2 = floorObstacles(7)
    expect(a1).toEqual(a2)
    const layouts = new Set([3, 4, 6, 7, 12, 23].map((f) => JSON.stringify(floorObstacles(f))))
    expect(layouts.size).toBeGreaterThan(4) // virtually every floor differs
  })

  it('keeps every pair of obstacles Chebyshev >= 2 (isolated cells ⇒ always walk-around-able)', () => {
    for (const floor of [2, 3, 7, 13, 42, 77, 99]) {
      const spots = floorObstacles(floor)
      expect(spots.length).toBeGreaterThanOrEqual(8)
      for (let i = 0; i < spots.length; i++) {
        for (let j = i + 1; j < spots.length; j++) {
          expect(cheb(spots[i], spots[j]), `floor ${floor} pair ${i},${j}`).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('never blocks the protected zones (spawn, boss door, dungeon entry) or the border', () => {
    const { w, h } = DEFAULT_GRID
    const cx = Math.floor(w / 2)
    for (const floor of [2, 5, 10, 34, 66, 98]) {
      for (const s of floorObstacles(floor)) {
        expect(s.x).toBeGreaterThanOrEqual(2)
        expect(s.x).toBeLessThanOrEqual(w - 3)
        expect(s.y).toBeGreaterThanOrEqual(3)
        expect(s.y).toBeLessThanOrEqual(h - 3)
        expect(cheb(s, { x: 2, y: h - 2 }), `floor ${floor} spawn`).toBeGreaterThan(3)
        expect(cheb(s, { x: cx, y: 2 }), `floor ${floor} boss door`).toBeGreaterThan(3)
        expect(cheb(s, { x: cx, y: h - 4 }), `floor ${floor} dungeon entry`).toBeGreaterThan(2)
      }
    }
  })
})

describe('floor variety — modifiers', () => {
  it('town and milestone floors are always vanilla', () => {
    for (const f of [1, 10, 11, 20, 21, 30, 50, 100]) {
      expect(floorModifier(f).id, `floor ${f}`).toBe('none')
    }
  })

  it('is deterministic and draws from the catalog', () => {
    for (let f = 2; f <= 99; f++) {
      const m = floorModifier(f)
      expect(m).toBe(floorModifier(f))
      expect(FLOOR_MODIFIERS[m.id]).toBe(m)
    }
  })

  it('all modifier kinds actually occur across the tower', () => {
    const seen = new Set<string>()
    for (let f = 2; f <= 99; f++) seen.add(floorModifier(f).id)
    for (const id of ['none', 'calm', 'swarm', 'mist', 'treasure']) expect(seen.has(id), id).toBe(true)
  })

  it('chest spots exist only on chest floors, clear of obstacles, with small deterministic rewards', () => {
    for (let f = 2; f <= 99; f++) {
      const mod = floorModifier(f)
      const obstacles = floorObstacles(f)
      const chests = chestSpots(f, obstacles)
      expect(chests.length).toBe(mod.chests)
      const blocked = new Set(obstacles.map((s) => `${s.x},${s.y}`))
      for (const [i, c] of chests.entries()) {
        expect(blocked.has(`${c.x},${c.y}`)).toBe(false)
        const r = chestReward(f, i)
        expect(r).toEqual(chestReward(f, i)) // deterministic
        expect(r.gold).toBeGreaterThan(0)
        expect(r.gold).toBeLessThanOrEqual(5 + Math.round(99 * 1.2)) // bounded — no jackpot
      }
    }
  })
})

describe('floor variety — biome decor', () => {
  it('every biome has a bush mapping, and every mapped key is a real curated bush', () => {
    const valid = new Set(WORLD1_BUSHES.map((b) => b.key))
    for (const biome of BIOMES) {
      const keys = BIOME_BUSHES[biome.id]
      expect(keys?.length, biome.id).toBeGreaterThan(0)
      for (const k of keys) expect(valid.has(k), k).toBe(true)
    }
  })

  it('decor spots are deterministic, in-bounds, and never sit on an obstacle', () => {
    for (const f of [2, 8, 27, 55, 83]) {
      const obstacles = floorObstacles(f)
      const spots = floorDecorSpots(f, 'forest', obstacles)
      expect(spots).toEqual(floorDecorSpots(f, 'forest', obstacles))
      const blocked = new Set(obstacles.map((s) => `${s.x},${s.y}`))
      for (const d of spots) {
        expect(blocked.has(`${d.x},${d.y}`)).toBe(false)
        expect(d.x).toBeGreaterThanOrEqual(1)
        expect(d.y).toBeGreaterThanOrEqual(1)
        expect(d.x).toBeLessThan(DEFAULT_GRID.w - 1)
        expect(d.y).toBeLessThan(DEFAULT_GRID.h - 1)
      }
    }
  })
})
