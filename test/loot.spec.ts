import { describe, it, expect, afterEach, vi } from 'vitest'
import { rollLoot, bossKeyItemId } from '~/data/loot'

afterEach(() => vi.restoreAllMocks())

describe('loot — deterministic under controlled randomness', () => {
  it('drops nothing extra for a weak non-boss roll (random high)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const drops = rollLoot(2, false) // world 1, non-boss
    expect(drops).toEqual([])
  })

  it('a boss always drops at least one material even on a high roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const drops = rollLoot(20, true)
    // boss material threshold is <1, so 0.99 still yields the base material drop
    expect(drops.length).toBeGreaterThanOrEqual(1)
  })

  it('a generous roll yields material + potion for a field monster', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const drops = rollLoot(2, false)
    const ids = drops.map((d) => d.itemId)
    expect(ids).toContain('potion_s')
    expect(drops.length).toBeGreaterThanOrEqual(2)
    for (const d of drops) expect(d.qty).toBeGreaterThan(0)
  })

  it('boss key fragments only drop from world 2+', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const w1 = rollLoot(2, false).map((d) => d.itemId)
    const w2 = rollLoot(12, false).map((d) => d.itemId)
    expect(w1).not.toContain(bossKeyItemId(1))
    expect(w2).toContain(bossKeyItemId(2))
  })
})
