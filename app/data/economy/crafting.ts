// ================================================================================================
// Sigil crafting (Phase 13)
//
// Deterministic crafting: a recipe (materials + gold) always yields the SAME sigil — never a random
// roll and never a gem cost (no paid loot box, constitution rule 4). All-or-nothing: nothing is spent
// unless both the materials and gold are available.
// ================================================================================================
import { getSigil } from './sigils'
import { consumeMaterials, hasMaterials, spend, type MaterialBag, type Wallet } from './currency'

export interface CraftResult {
  ok: boolean
  wallet: Wallet
  materials: MaterialBag
  /** the crafted sigil id on success. */
  sigilId?: string
  reason?: 'unknown-sigil' | 'missing-materials' | 'insufficient-gold'
}

/** Craft one sigil, consuming its material + gold cost. Pure — returns new wallet/material bag. */
export function craftSigil(sigilId: string, wallet: Wallet, materials: MaterialBag): CraftResult {
  const sigil = getSigil(sigilId)
  if (!sigil) return { ok: false, wallet, materials, reason: 'unknown-sigil' }
  if (!hasMaterials(materials, sigil.craftCost.materials)) return { ok: false, wallet, materials, reason: 'missing-materials' }
  if (wallet.gold < sigil.craftCost.gold) return { ok: false, wallet, materials, reason: 'insufficient-gold' }

  const materialsOut = consumeMaterials(materials, sigil.craftCost.materials).bag
  const walletOut = spend(wallet, { gold: sigil.craftCost.gold }).wallet
  return { ok: true, wallet: walletOut, materials: materialsOut, sigilId }
}
