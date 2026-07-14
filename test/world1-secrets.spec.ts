import { describe, it, expect } from 'vitest'
import { WORLD1_SECRETS, getWorld1Secret } from '~/data/world1/secrets'
import { getDungeonLayout } from '~/game/runtime/dungeonLayouts'

// ================================================================================================
// Phase 14 Inc 4 — World-1 secrets: ≥3, each anchored to a real DungeonSecret placed in a layout.
// ================================================================================================

describe('World-1 secrets — data', () => {
  it('defines at least 3 secrets with unique ids and bounded, positive rewards', () => {
    expect(WORLD1_SECRETS.length).toBeGreaterThanOrEqual(3)
    const ids = WORLD1_SECRETS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of WORLD1_SECRETS) {
      expect(s.name.length).toBeGreaterThan(0)
      expect(s.reward.exp).toBeGreaterThan(0)
      expect(s.reward.gold).toBeGreaterThan(0)
      expect(s.reward.gems).toBeLessThanOrEqual(2) // bounded — no jackpot
    }
  })

  it('every secret id is actually placed in its layout config (so the scene can render it)', () => {
    for (const s of WORLD1_SECRETS) {
      const layout = getDungeonLayout(s.layoutId)
      expect(layout.secrets.some((ds) => ds.id === s.id)).toBe(true)
    }
  })

  it('getWorld1Secret resolves by id', () => {
    expect(getWorld1Secret('w1-main-chest')?.layoutId).toBe('world01-main')
    expect(getWorld1Secret('nope')).toBeUndefined()
  })
})
