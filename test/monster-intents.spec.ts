// ================================================================================================
// Monster intents — telegraphed turn-based moves. Deterministic under a seeded RNG, sane
// multipliers (heavy hurts, snarl never does), all kinds reachable for both boss and normal.
// ================================================================================================
import { describe, it, expect } from 'vitest'
import { MONSTER_INTENTS_ENABLED, MONSTER_INTENTS, rollIntent, type MonsterIntentId } from '~/data/combat'
import { mulberry32 } from '~/data/learning/rng'

describe('monster intents', () => {
  it('flag is on (telegraphed moves live in BattleModal)', () => {
    expect(MONSTER_INTENTS_ENABLED).toBe(true)
  })

  it('catalog multipliers: attack x1, heavy > 1, snarl = 0 (never lethal by itself)', () => {
    expect(MONSTER_INTENTS.attack.multiplier).toBe(1)
    expect(MONSTER_INTENTS.heavy.multiplier).toBeGreaterThan(1)
    expect(MONSTER_INTENTS.snarl.multiplier).toBe(0)
    for (const spec of Object.values(MONSTER_INTENTS)) {
      expect(spec.labelTh.length).toBeGreaterThan(0)
      expect(spec.icon.length).toBeGreaterThan(0)
    }
  })

  it('is deterministic under a seeded rng', () => {
    const roll = (seed: number) => {
      const rng = mulberry32(seed)
      return Array.from({ length: 20 }, () => rollIntent(rng))
    }
    expect(roll(5)).toEqual(roll(5))
  })

  it('all intent kinds occur, and bosses roll heavy more often than normals', () => {
    const count = (isBoss: boolean) => {
      const rng = mulberry32(42)
      const c: Record<MonsterIntentId, number> = { attack: 0, heavy: 0, snarl: 0 }
      for (let i = 0; i < 2000; i++) c[rollIntent(rng, isBoss)]++
      return c
    }
    const normal = count(false)
    const boss = count(true)
    for (const k of ['attack', 'heavy', 'snarl'] as const) {
      expect(normal[k]).toBeGreaterThan(0)
      expect(boss[k]).toBeGreaterThan(0)
    }
    expect(boss.heavy).toBeGreaterThan(normal.heavy)
  })
})
