import { describe, it, expect } from 'vitest'
import { rollDailyQuests } from '~/data/quests'

describe('daily quests — deterministic generation', () => {
  it('produces the same 3 quests for the same date+floor (seeded)', () => {
    const a = rollDailyQuests('2026-07-12', 10)
    const b = rollDailyQuests('2026-07-12', 10)
    expect(a).toEqual(b)
    expect(a.length).toBe(3)
  })

  it('differs across dates (seed varies by date)', () => {
    const a = rollDailyQuests('2026-07-12', 10)
    const b = rollDailyQuests('2026-07-13', 10)
    // At least one target should differ across a day boundary for a typical seed.
    const sameTargets = a.every((q, i) => q.target === b[i].target)
    expect(sameTargets).toBe(false)
  })

  it('covers the three activity kinds and starts unclaimed with zero progress', () => {
    const q = rollDailyQuests('2026-07-12', 5)
    expect(q.map((x) => x.kind).sort()).toEqual(['answer', 'climb', 'defeat'])
    for (const item of q) {
      expect(item.progress).toBe(0)
      expect(item.claimed).toBe(false)
      expect(item.target).toBeGreaterThan(0)
      expect(item.reward.gold).toBeGreaterThan(0)
      expect(item.reward.exp).toBeGreaterThan(0)
      expect(item.reward.gems).toBeGreaterThanOrEqual(0)
    }
  })

  it('reward scales with floor', () => {
    const low = rollDailyQuests('2026-07-12', 1)
    const high = rollDailyQuests('2026-07-12', 90)
    // Same seed/date ⇒ same targets, so higher floor ⇒ higher gold reward per quest.
    for (let i = 0; i < low.length; i++) {
      expect(high[i].reward.gold).toBeGreaterThan(low[i].reward.gold)
    }
  })
})
