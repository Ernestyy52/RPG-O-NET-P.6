// RO-inspired stat allocation (app/data/statAllocation.ts) — pure-math contract:
// points per level are deterministic, cost escalates every 10 points in one attribute,
// bonuses map onto the game's real stat channels, and corrupt saves can never go negative.
import { describe, it, expect } from 'vitest'
import {
  ALLOC_DEFS, STAT_POINTS_PER_LEVEL, statPointsEarned, allocCost, statPointsSpent,
  statPointsAvailable, canAllocate, allocBonus, sanitizeAlloc,
} from '~/data/statAllocation'

describe('stat allocation — points & costs', () => {
  it('earns 3 points per level starting from level 2', () => {
    expect(statPointsEarned(1)).toBe(0)
    expect(statPointsEarned(2)).toBe(STAT_POINTS_PER_LEVEL)
    expect(statPointsEarned(11)).toBe(10 * STAT_POINTS_PER_LEVEL)
    expect(statPointsEarned(0)).toBe(0) // corrupt level never yields negative
  })

  it('cost escalates every 10 points in the same attribute (1 → 2 → 3)', () => {
    expect(allocCost(0)).toBe(1)
    expect(allocCost(9)).toBe(1)
    expect(allocCost(10)).toBe(2)
    expect(allocCost(19)).toBe(2)
    expect(allocCost(20)).toBe(3)
  })

  it('spent = sum of the escalating ladder, split across attributes', () => {
    expect(statPointsSpent({})).toBe(0)
    expect(statPointsSpent({ atk: 10 })).toBe(10) // 10 × cost 1
    expect(statPointsSpent({ atk: 12 })).toBe(10 + 2 * 2) // points 11–12 cost 2 each
    expect(statPointsSpent({ atk: 5, vit: 5 })).toBe(10) // spreading stays cheap — anti-dump curve
  })

  it('canAllocate respects the remaining budget', () => {
    // level 3 ⇒ 6 points; 5 spent ⇒ 1 left ⇒ a cost-1 point fits, nothing more after it
    const alloc = { vit: 5 }
    expect(statPointsAvailable(3, alloc)).toBe(1)
    expect(canAllocate(3, alloc, 'atk')).toBe(true)
    expect(canAllocate(3, { vit: 6 }, 'atk')).toBe(false)
  })
})

describe('stat allocation — bonuses & sanitize', () => {
  it('maps every attribute onto a real stat channel (VIT is the HP battery)', () => {
    expect(allocBonus({ vit: 2, atk: 3, wis: 1 })).toEqual({ hp: 12, atk: 3, knowledge: 1 })
    expect(allocBonus({})).toEqual({}) // nothing spent ⇒ stats byte-identical to pre-feature saves
    const keys = ALLOC_DEFS.map((d) => d.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('sanitize drops junk keys, floors decimals, and zeroes an over-spent (corrupt) block', () => {
    expect(sanitizeAlloc({ vit: 2.9, hack: 99, atk: -5 }, 10)).toEqual({ vit: 2 })
    expect(sanitizeAlloc(undefined, 5)).toEqual({})
    expect(sanitizeAlloc('junk', 5)).toEqual({})
    // level 2 grants 3 points but 30 are spent ⇒ reset instead of negative balance
    expect(sanitizeAlloc({ atk: 30 }, 2)).toEqual({})
  })
})
