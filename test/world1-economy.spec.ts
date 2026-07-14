import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '~/stores/player'
import { WORLD1_MAIN_QUEST } from '~/data/world1/quests'
import { WORLD1_SIDE_QUESTS } from '~/data/world1/sideQuests'
import { WORLD1_SECRETS } from '~/data/world1/secrets'
import { simulateEconomy } from '~/data/economy'

// ================================================================================================
// Phase 14 Inc 4/5 gate — economy health of the NEW World-1 reward sources (quests / side quests /
// secrets), plus a re-assert of the seeded encounter sim. Proves: no negative currency, no gem
// jackpot, and the full content haul neither trivialises nor grind-breaks World-1 progression.
// ================================================================================================

beforeEach(() => setActivePinia(createPinia()))

const allRewards = [
  ...WORLD1_MAIN_QUEST.map((s) => s.reward),
  ...WORLD1_SIDE_QUESTS.map((q) => q.reward),
  ...WORLD1_SECRETS.map((s) => s.reward),
]
const sum = (pick: (r: { exp: number; gold: number; gems: number }) => number) =>
  allRewards.reduce((t, r) => t + pick(r), 0)

describe('World-1 content economy — reward sanity', () => {
  it('every reward is non-negative (no negative currency by construction)', () => {
    for (const r of allRewards) {
      expect(r.exp).toBeGreaterThanOrEqual(0)
      expect(r.gold).toBeGreaterThanOrEqual(0)
      expect(r.gems).toBeGreaterThanOrEqual(0)
    }
  })

  it('gems stay scarce across all content (earned, not a jackpot)', () => {
    const totalGems = sum((r) => r.gems)
    expect(totalGems).toBeGreaterThan(0)   // some gems exist
    expect(totalGems).toBeLessThanOrEqual(30) // but bounded — no runaway premium currency
  })

  it('the full content haul is bounded (no single reward dominates)', () => {
    const totalGold = sum((r) => r.gold)
    expect(totalGold).toBeGreaterThan(0)
    for (const r of allRewards) expect(r.gold).toBeLessThanOrEqual(totalGold / 3) // no one reward is most of the economy
  })
})

describe('World-1 content economy — applied to a real player', () => {
  it('claiming ALL World-1 content leaves a sane level/gold band (no trivialise, no grind-break)', () => {
    const p = usePlayerStore()
    p.createCharacter({ name: 'Eco', gender: 'male', classId: 'warrior', face: 'calm', hair: 'short', color: 'amber' })
    const gold0 = p.gold
    for (const r of allRewards) p.gainRewards(r.exp, r.gold, r.gems)

    expect(p.gold).toBeGreaterThan(gold0)      // net positive
    expect(p.gold).toBeGreaterThanOrEqual(0)   // never negative
    expect(p.gems).toBeGreaterThanOrEqual(0)
    // a full World-1 content clear should meaningfully level a fresh hero, but not explode past the world
    expect(p.level).toBeGreaterThanOrEqual(4)
    expect(p.level).toBeLessThanOrEqual(30)
  })
})

describe('World-1 economy — seeded encounter sim stays healthy (gate re-assert)', () => {
  it('never goes negative, gems come from bosses, and tier-2 gear is affordable without extreme grind', () => {
    const res = simulateEconomy({ seed: 1234, encounters: 60, startFloor: 1, buyEvery: 8 })
    expect(res.everNegative).toBe(false)
    expect(res.gemsEarned).toBe(res.bossKills) // gems only from boss kills (earned)
    expect(res.encountersToAffordTier2).toBeGreaterThan(0)
    expect(res.encountersToAffordTier2).toBeLessThanOrEqual(20) // affordable within a reasonable span
  })
})
