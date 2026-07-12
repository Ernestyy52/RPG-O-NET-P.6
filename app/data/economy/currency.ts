// ================================================================================================
// Currency & material transactions (Phase 13, ADR 0001/0002)
//
// Pure, total transaction helpers for the economy. Every spend is validated and clamped so a balance
// can NEVER go negative (constitution rule 3: rewards/economy validated, never trusted from UI), and
// material consumption is all-or-nothing. Progression rewards are granted through the Phase 07
// RewardLedger so a reward is claimed at most once (no duplicate claims). No randomness here.
// ================================================================================================
import { buildRewardRequest, type RewardLedger, type RewardRequest } from '~/data/combat'

export interface Wallet {
  gold: number
  gems: number
}

export interface Cost {
  gold?: number
  gems?: number
}

export function canAfford(wallet: Wallet, cost: Cost): boolean {
  return wallet.gold >= (cost.gold ?? 0) && wallet.gems >= (cost.gems ?? 0)
}

/** Spend from a wallet. Returns a NEW wallet and ok=false (unchanged) when unaffordable — never negative. */
export function spend(wallet: Wallet, cost: Cost): { ok: boolean; wallet: Wallet } {
  if (!canAfford(wallet, cost)) return { ok: false, wallet }
  return { ok: true, wallet: { gold: wallet.gold - (cost.gold ?? 0), gems: wallet.gems - (cost.gems ?? 0) } }
}

/** Add earnings to a wallet (negative gains are ignored so income can't drain a balance). */
export function earn(wallet: Wallet, gain: Cost): Wallet {
  return { gold: wallet.gold + Math.max(0, gain.gold ?? 0), gems: wallet.gems + Math.max(0, gain.gems ?? 0) }
}

export type MaterialBag = Record<string, number>

export function addMaterial(bag: MaterialBag, id: string, qty = 1): MaterialBag {
  return { ...bag, [id]: Math.max(0, (bag[id] ?? 0) + qty) }
}

export function hasMaterials(bag: MaterialBag, needs: { id: string; qty: number }[]): boolean {
  return needs.every((n) => (bag[n.id] ?? 0) >= n.qty)
}

/** Consume materials all-or-nothing. Returns ok=false + the unchanged bag when short — never negative. */
export function consumeMaterials(bag: MaterialBag, needs: { id: string; qty: number }[]): { ok: boolean; bag: MaterialBag } {
  if (!hasMaterials(bag, needs)) return { ok: false, bag }
  const out = { ...bag }
  for (const n of needs) out[n.id] = out[n.id] - n.qty
  return { ok: true, bag: out }
}

/**
 * Grant a progression reward exactly once via a RewardLedger. Returns the applied wallet + the granted
 * request, or ok=false with the wallet unchanged when this reward id was already claimed.
 */
export function claimReward(
  wallet: Wallet,
  ledger: RewardLedger,
  reward: { id: string; gold?: number; gems?: number },
): { ok: boolean; wallet: Wallet; request: RewardRequest } {
  const request = buildRewardRequest({ encounterId: reward.id, exp: 0, gold: reward.gold ?? 0, gems: reward.gems ?? 0 })
  if (!ledger.claim(request)) return { ok: false, wallet, request }
  return { ok: true, wallet: earn(wallet, { gold: request.gold, gems: request.gems }), request }
}
