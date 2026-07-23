// ================================================================================================
// Seeded economy simulation (Phase 13)
//
// A deterministic model of currency flow over a run of encounters, used to prove economy health
// (constitution rule 3 / gate): same seed ⇒ same result, currency NEVER goes negative, gems come only
// from boss kills (earned, not purchased), and gear upgrades are affordable within a bounded number of
// encounters (no extreme grind). Income is grounded in the real floor reward curve (data/floors).
// ================================================================================================
import { mulberry32 } from '~/data/learning/rng'
import { getFloorConfig } from '~/data/floors'
import { addMaterial, earn, spend, type MaterialBag, type Wallet } from './currency'

export interface EconomyState {
  wallet: Wallet
  materials: MaterialBag
}

export interface SimConfig {
  seed: number
  encounters: number
  startFloor?: number
  /** attempt a gear upgrade every N encounters. */
  buyEvery?: number
}

export interface SimResult {
  final: EconomyState
  goldEarned: number
  goldSpent: number
  gemsEarned: number
  bossKills: number
  everNegative: boolean
  peakEncounterGold: number
  /** first encounter index (1-based) at which cumulative gold could afford a tier-2 item; -1 if never. */
  encountersToAffordTier2: number
}

/** Common tier-2 item cost, mirroring the equipment cost formula (40·t + 12·t² at rarity common). */
export const TIER2_ITEM_COST = 40 * 2 + 12 * 2 * 2 // 128

export function simulateEconomy(config: SimConfig): SimResult {
  const rng = mulberry32(config.seed)
  const startFloor = config.startFloor ?? 1
  const buyEvery = config.buyEvery ?? 8

  let wallet: Wallet = { gold: 0, gems: 0 }
  let materials: MaterialBag = {}
  let goldEarned = 0
  let goldSpent = 0
  let gemsEarned = 0
  let bossKills = 0
  let peakEncounterGold = 0
  let everNegative = false
  let cumulativeGold = 0
  let encountersToAffordTier2 = -1

  for (let i = 0; i < config.encounters; i++) {
    const floor = startFloor + Math.floor(i / 5)
    const cfg = getFloorConfig(floor)
    const isBoss = (i + 1) % 10 === 0

    const goldGain = cfg.goldReward * (isBoss ? 4 : 1)
    wallet = earn(wallet, { gold: goldGain, gems: isBoss ? 1 : 0 })
    goldEarned += goldGain
    peakEncounterGold = Math.max(peakEncounterGold, goldGain)
    cumulativeGold += goldGain
    if (isBoss) { gemsEarned += 1; bossKills += 1 }
    if (encountersToAffordTier2 < 0 && cumulativeGold >= TIER2_ITEM_COST) encountersToAffordTier2 = i + 1

    // Material drop (seeded) — feeds crafting, never a paid roll.
    if (rng() < 0.5) materials = addMaterial(materials, 'slime_gel', 1)

    // Periodic gear-upgrade sink — validated spend, so the balance can never dip below zero.
    if ((i + 1) % buyEvery === 0) {
      const res = spend(wallet, { gold: TIER2_ITEM_COST })
      if (res.ok) { wallet = res.wallet; goldSpent += TIER2_ITEM_COST }
    }

    if (wallet.gold < 0 || wallet.gems < 0) everNegative = true
  }

  return {
    final: { wallet, materials },
    goldEarned, goldSpent, gemsEarned, bossKills,
    everNegative, peakEncounterGold, encountersToAffordTier2,
  }
}
