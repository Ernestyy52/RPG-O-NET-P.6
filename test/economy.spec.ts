import { describe, it, expect } from 'vitest'
import {
  spend, earn, canAfford, consumeMaterials, hasMaterials, addMaterial, claimReward,
  SIGILS, getSigil, applySigils, socketSigil, unsocketSigil, totalSigilBonus, SIGIL_SOCKET_CAP,
  craftSigil, simulateEconomy, TIER2_ITEM_COST, type Wallet,
} from '~/data/economy'
import { RewardLedger } from '~/data/combat'

// ================================================================================================
// Phase 13 — progression/loot/crafting/Sigils: seeded economy sim, no negative currency, no
// duplicate claims, no extreme grind, no paid loot box.
// ================================================================================================

describe('currency — never goes negative', () => {
  it('rejects an unaffordable spend and leaves the wallet unchanged', () => {
    const w: Wallet = { gold: 50, gems: 1 }
    const res = spend(w, { gold: 80 })
    expect(res.ok).toBe(false)
    expect(res.wallet).toEqual({ gold: 50, gems: 1 })
    expect(canAfford(w, { gems: 5 })).toBe(false)
  })

  it('applies an affordable spend without dropping below zero', () => {
    const res = spend({ gold: 100, gems: 3 }, { gold: 100, gems: 3 })
    expect(res.ok).toBe(true)
    expect(res.wallet).toEqual({ gold: 0, gems: 0 })
  })

  it('consumes materials all-or-nothing', () => {
    const bag = addMaterial(addMaterial({}, 'slime_gel', 2), 'sand_crystal', 1)
    expect(hasMaterials(bag, [{ id: 'slime_gel', qty: 3 }])).toBe(false)
    const fail = consumeMaterials(bag, [{ id: 'slime_gel', qty: 3 }])
    expect(fail.ok).toBe(false)
    expect(fail.bag).toEqual(bag) // unchanged
    const ok = consumeMaterials(bag, [{ id: 'slime_gel', qty: 2 }])
    expect(ok.ok).toBe(true)
    expect(ok.bag.slime_gel).toBe(0)
  })
})

describe('currency — progression rewards are idempotent (no duplicate claims)', () => {
  it('grants a reward once through the ledger', () => {
    const ledger = new RewardLedger()
    let wallet: Wallet = { gold: 0, gems: 0 }
    const first = claimReward(wallet, ledger, { id: 'quest-42', gold: 50, gems: 1 })
    expect(first.ok).toBe(true)
    wallet = first.wallet
    expect(wallet).toEqual({ gold: 50, gems: 1 })
    const second = claimReward(wallet, ledger, { id: 'quest-42', gold: 50, gems: 1 })
    expect(second.ok).toBe(false)
    expect(second.wallet).toEqual({ gold: 50, gems: 1 }) // no double payout
  })
})

describe('sigils — bounded, socketable, no paid loot box', () => {
  it('every sigil is crafted from materials + gold only — never gems, never random', () => {
    for (const s of SIGILS) {
      expect(s.craftCost.gold).toBeGreaterThan(0)
      expect(s.craftCost.materials.length).toBeGreaterThan(0)
      expect((s.craftCost as { gems?: number }).gems).toBeUndefined() // no gem cost anywhere
    }
  })

  it('bonuses are bounded and tier-scaled', () => {
    const t1 = getSigil('sigil_might_t1')!
    const t5 = getSigil('sigil_might_t5')!
    expect(t1.stats.atk).toBe(2)
    expect(t5.stats.atk).toBe(10) // capped at 2×tier
  })

  it('craftSigil is deterministic and consumes the exact cost', () => {
    const sigil = getSigil('sigil_ward_t2')!
    const wallet: Wallet = { gold: 500, gems: 0 }
    const materials = { [sigil.craftCost.materials[0].id]: 5 }
    const a = craftSigil('sigil_ward_t2', wallet, materials)
    const b = craftSigil('sigil_ward_t2', wallet, materials)
    expect(a.ok).toBe(true)
    expect(a.sigilId).toBe('sigil_ward_t2')
    expect(a).toEqual(b) // same inputs ⇒ same output, no randomness
    expect(a.wallet.gold).toBe(500 - sigil.craftCost.gold)
    expect(a.materials[sigil.craftCost.materials[0].id]).toBe(5 - sigil.craftCost.materials[0].qty)
  })

  it('respects the socket cap and rejects duplicates', () => {
    let socketed: string[] = []
    socketed = socketSigil(socketed, 'sigil_might_t1').socketed
    socketed = socketSigil(socketed, 'sigil_ward_t1').socketed
    expect(socketed.length).toBe(SIGIL_SOCKET_CAP)
    const overCap = socketSigil(socketed, 'sigil_vigor_t1')
    expect(overCap.ok).toBe(false) // full
    const dup = socketSigil(['sigil_might_t1'], 'sigil_might_t1')
    expect(dup.ok).toBe(false) // already socketed
    expect(unsocketSigil(socketed, 'sigil_might_t1')).toEqual(['sigil_ward_t1'])
  })

  it('aggregates socketed bonuses across slots', () => {
    const bonus = totalSigilBonus({ weapon: ['sigil_might_t2'], armor: ['sigil_vigor_t3'] })
    expect(bonus.atk).toBe(4) // 2×2
    expect(bonus.hp).toBe(12) // 4×3
    expect(applySigils(['sigil_might_t1', 'sigil_might_t2']).atk).toBe(2 + 4)
  })
})

describe('economy sim — seeded, healthy, no extreme grind', () => {
  it('is deterministic for a given seed', () => {
    const a = simulateEconomy({ seed: 7, encounters: 100 })
    const b = simulateEconomy({ seed: 7, encounters: 100 })
    expect(a).toEqual(b)
    const c = simulateEconomy({ seed: 8, encounters: 100 })
    expect(a.final.materials).not.toEqual(c.final.materials)
  })

  it('never lets currency go negative and gems come only from bosses', () => {
    for (const seed of [1, 2, 3, 42, 99]) {
      const r = simulateEconomy({ seed, encounters: 120 })
      expect(r.everNegative).toBe(false)
      expect(r.final.wallet.gold).toBeGreaterThanOrEqual(0)
      expect(r.final.wallet.gems).toBeGreaterThanOrEqual(0)
      expect(r.gemsEarned).toBe(r.bossKills) // 1 gem per boss, none purchased
      expect(r.bossKills).toBe(Math.floor(120 / 10))
    }
  })

  it('reaches gear upgrades within a bounded number of encounters (no grind wall)', () => {
    const r = simulateEconomy({ seed: 5, encounters: 100 })
    expect(r.encountersToAffordTier2).toBeGreaterThan(0)
    expect(r.encountersToAffordTier2).toBeLessThanOrEqual(20) // affordable early — not a grind wall
    expect(r.goldEarned).toBeGreaterThan(TIER2_ITEM_COST)
    expect(r.goldSpent).toBeGreaterThan(0) // the sink actually runs
  })
})
