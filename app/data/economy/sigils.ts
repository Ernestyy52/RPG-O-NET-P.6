// ================================================================================================
// Sigils — socketable progression augments (Phase 13)
//
// Sigils are craftable stat augments socketed into equipment. They are a pure progression sink:
//  • NO paid loot box / gambling — a sigil is CRAFTED from materials (earned by play) + gold via a
//    deterministic recipe (a recipe always yields the same specific sigil). No gems, no randomized
//    "open for a chance at" mechanic exists anywhere in this module (constitution rule 4).
//  • Bonuses are BOUNDED (small, tier-scaled) and sockets are capped, so sigils can't create a
//    pay-to-win / runaway-power path.
// Bonuses stack onto gear stats and are otherwise inert combat data.
// ================================================================================================
import type { StatBlock, EquipmentSlot } from '~/data/equipment'

/** Rollback flag (Phase 13 → Phase 14 flip #6). LIVE: sigils can be crafted + socketed into gear and
 *  their bounded bonuses stack onto stats. Revert to false ⇒ sockets hidden, bonuses inert, data kept. */
export const SIGILS_ENABLED = true

/** Max sigils socketable into a single equipment piece. */
export const SIGIL_SOCKET_CAP = 2

export type SigilElement = 'might' | 'ward' | 'vigor' | 'swift' | 'insight'

export interface Sigil {
  id: string
  name: string
  element: SigilElement
  tier: number // 1..5
  stats: StatBlock
  /** deterministic craft cost — materials + gold only, never gems. */
  craftCost: { gold: number; materials: { id: string; qty: number }[] }
}

const ELEMENT_STAT: Record<SigilElement, keyof StatBlock> = {
  might: 'atk',
  ward: 'def',
  vigor: 'hp',
  swift: 'speed',
  insight: 'knowledge',
}

const ELEMENT_LABEL: Record<SigilElement, string> = {
  might: 'Might', ward: 'Ward', vigor: 'Vigor', swift: 'Swift', insight: 'Insight',
}

/** Tier→material used to craft (mirrors the existing material tiers in equipment.ts). */
const TIER_MATERIAL: Record<number, string> = {
  1: 'slime_gel', 2: 'sand_crystal', 3: 'frost_shard', 4: 'magma_core', 5: 'crystal_dust',
}

function buildSigil(element: SigilElement, tier: number): Sigil {
  const stat = ELEMENT_STAT[element]
  const stats: StatBlock = {}
  // Bounded: primary = 2×tier (max +10 at t5); vigor scales HP a bit higher since HP points are cheap.
  stats[stat] = element === 'vigor' ? tier * 4 : tier * 2
  return {
    id: `sigil_${element}_t${tier}`,
    name: `${ELEMENT_LABEL[element]} Sigil ${'I'.repeat(tier)}`,
    element,
    tier,
    stats,
    craftCost: {
      gold: 20 * tier * tier,
      materials: [{ id: TIER_MATERIAL[tier], qty: tier }],
    },
  }
}

export const SIGILS: Sigil[] = (Object.keys(ELEMENT_STAT) as SigilElement[])
  .flatMap((element) => [1, 2, 3, 4, 5].map((tier) => buildSigil(element, tier)))

const SIGIL_BY_ID = new Map(SIGILS.map((s) => [s.id, s]))

export function getSigil(id: string): Sigil | undefined {
  return SIGIL_BY_ID.get(id)
}

/** Aggregate the stat bonus of a set of socketed sigils. Pure. */
export function applySigils(sigilIds: string[]): StatBlock {
  const out: StatBlock = {}
  for (const id of sigilIds) {
    const sigil = SIGIL_BY_ID.get(id)
    if (!sigil) continue
    for (const [k, v] of Object.entries(sigil.stats)) {
      out[k as keyof StatBlock] = (out[k as keyof StatBlock] ?? 0) + (v ?? 0)
    }
  }
  return out
}

/**
 * Socket a sigil into an equipment piece. Rejects (returns the unchanged array) when the piece is at
 * the socket cap or already holds this exact sigil id — bounded, deterministic, no gambling.
 */
export function socketSigil(socketed: string[], sigilId: string, cap = SIGIL_SOCKET_CAP): { ok: boolean; socketed: string[] } {
  if (!SIGIL_BY_ID.has(sigilId)) return { ok: false, socketed }
  if (socketed.length >= cap || socketed.includes(sigilId)) return { ok: false, socketed }
  return { ok: true, socketed: [...socketed, sigilId] }
}

export function unsocketSigil(socketed: string[], sigilId: string): string[] {
  return socketed.filter((id) => id !== sigilId)
}

export type SocketedSigils = Partial<Record<EquipmentSlot, string[]>>

/** Total sigil bonus across every equipped piece's sockets. */
export function totalSigilBonus(socketed: SocketedSigils): StatBlock {
  return applySigils(Object.values(socketed).flat().filter((id): id is string => !!id))
}
