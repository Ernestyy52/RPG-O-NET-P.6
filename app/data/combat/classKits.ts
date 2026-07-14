// ================================================================================================
// Class kits (Phase 12, ADR 0002)
//
// Each hero class gets a distinct kit of ACTIVE combat abilities built on the Phase 07 domain (this is
// separate from the existing passive stat skill-tree in app/data/skills.ts). A kit gives the class its
// combat identity: what it does that the others don't.
//
// Design invariants (verified in test/class-kits.spec.ts):
//  • Identity obvious — each kit has a signature line and a distinct ability set; the three combat axes
//    (sustained DPS / mitigation / sustain) each have a different class as their leader.
//  • No mandatory best path — no class leads more than one axis, and total kit value stays within a
//    tight parity band, so no single kit dominates.
//  • No useless solo class — every kit has a damage ability AND a mitigation-or-sustain ability, so it
//    can clear content alone.
//
// Damage math reuses the domain's `heroDamage` (no duplicated formula). Deep combat wiring lands with
// World 1 (Phase 14); this module is pure data + a resolver, gated by CLASS_KITS_ENABLED.
// ================================================================================================
import type { HeroClassId } from '~/data/classes'
import { heroDamage, type WorldCombatModifier, NEUTRAL_WORLD } from './formulas'

/** Rollback flag (Phase 12). Dormant — kits aren't equipped in the live store until World 1. */
export const CLASS_KITS_ENABLED = false

export type KitAbilityKind = 'strike' | 'guard' | 'heal' | 'rally' | 'counter'

export interface KitAbility {
  id: string
  classId: HeroClassId
  name: string
  description: string
  kind: KitAbilityKind
  mpCost: number
  cooldownMs: number
  /** strike/counter: hero-damage multiplier. */
  damageMultiplier?: number
  /** guard/counter: multiplier applied to the next incoming hit (lower ⇒ more mitigation). */
  incomingMultiplier?: number
  /** heal: base heal before knowledge scaling. */
  healBase?: number
  /** rally: MP restored / combo empower magnitude. */
  rallyValue?: number
}

export interface ClassKit {
  classId: HeroClassId
  /** one-line identity statement. */
  signature: string
  abilities: KitAbility[]
}

export const CLASS_KITS: Record<HeroClassId, ClassKit> = {
  warrior: {
    classId: 'warrior',
    signature: 'Balanced bruiser — steady damage with reliable self-sustain.',
    abilities: [
      { id: 'warrior_power_strike', classId: 'warrior', name: 'Power Strike', description: 'A heavy melee blow.', kind: 'strike', mpCost: 0, cooldownMs: 800, damageMultiplier: 1.4 },
      { id: 'warrior_bulwark', classId: 'warrior', name: 'Bulwark', description: 'Brace to soften the next hit.', kind: 'guard', mpCost: 6, cooldownMs: 4000, incomingMultiplier: 0.4 },
      { id: 'warrior_second_wind', classId: 'warrior', name: 'Second Wind', description: 'Catch your breath and recover HP.', kind: 'heal', mpCost: 8, cooldownMs: 6000, healBase: 16 },
    ],
  },
  mage: {
    classId: 'mage',
    signature: 'Glass cannon & healer — biggest burst and best mending, but MP-hungry and fragile.',
    abilities: [
      { id: 'mage_arcane_bolt', classId: 'mage', name: 'Arcane Bolt', description: 'A high-burst spell.', kind: 'strike', mpCost: 6, cooldownMs: 1200, damageMultiplier: 1.7 },
      { id: 'mage_ward', classId: 'mage', name: 'Ward', description: 'A shimmering shield against the next hit.', kind: 'guard', mpCost: 8, cooldownMs: 5000, incomingMultiplier: 0.3 },
      { id: 'mage_mend', classId: 'mage', name: 'Mend', description: 'Channel a strong restorative spell.', kind: 'heal', mpCost: 10, cooldownMs: 6000, healBase: 26 },
    ],
  },
  archer: {
    classId: 'archer',
    signature: 'Fast striker — low-cooldown shots and evasion; wins by tempo, not big hits.',
    abilities: [
      { id: 'archer_double_shot', classId: 'archer', name: 'Double Shot', description: 'Two quick arrows on a short cooldown.', kind: 'strike', mpCost: 0, cooldownMs: 400, damageMultiplier: 0.9 },
      { id: 'archer_evade', classId: 'archer', name: 'Evade', description: 'Roll to slip the next attack.', kind: 'guard', mpCost: 5, cooldownMs: 4500, incomingMultiplier: 0.2 },
      { id: 'archer_focus', classId: 'archer', name: 'Focus', description: 'Steady your aim — restore focus (MP/combo).', kind: 'rally', mpCost: 4, cooldownMs: 5000, rallyValue: 6 },
    ],
  },
  guardian: {
    classId: 'guardian',
    signature: 'Defensive tank — top mitigation and punishing counters; low raw damage.',
    abilities: [
      { id: 'guardian_shield_bash', classId: 'guardian', name: 'Shield Bash', description: 'A sturdy bash.', kind: 'strike', mpCost: 0, cooldownMs: 900, damageMultiplier: 1.1 },
      { id: 'guardian_fortress', classId: 'guardian', name: 'Fortress', description: 'Plant your shield for heavy mitigation.', kind: 'guard', mpCost: 6, cooldownMs: 3500, incomingMultiplier: 0.25 },
      { id: 'guardian_retribution', classId: 'guardian', name: 'Retribution', description: 'Counter-strike that also softens the next hit.', kind: 'counter', mpCost: 6, cooldownMs: 3000, damageMultiplier: 0.65, incomingMultiplier: 0.45 },
    ],
  },
}

const ABILITY_BY_ID = new Map<string, KitAbility>()
for (const kit of Object.values(CLASS_KITS)) for (const a of kit.abilities) ABILITY_BY_ID.set(a.id, a)

export function getClassKit(classId: HeroClassId): ClassKit {
  return CLASS_KITS[classId] ?? CLASS_KITS.warrior
}

export function kitAbility(id: string): KitAbility | undefined {
  return ABILITY_BY_ID.get(id)
}

/** The starter loadout for a class — every ability in its kit, in order. Used as the save default. */
export function defaultLoadout(classId: HeroClassId): string[] {
  return getClassKit(classId).abilities.map((a) => a.id)
}

/** Damage of a strike/counter ability, via the domain formula (single source; no duplication). */
export function kitAbilityDamage(ability: KitAbility, atk: number, knowledge: number, world: WorldCombatModifier = NEUTRAL_WORLD): number {
  if (ability.damageMultiplier === undefined) return 0
  return heroDamage(atk, knowledge, ability.damageMultiplier, world.knowledge)
}

export interface KitProfile {
  /** sustained damage-multiplier per second from strike/counter abilities. */
  dps: number
  /** mitigation-per-second from guard/counter incoming reduction. */
  mitigation: number
  /** sustain-per-second from heal/rally abilities. */
  sustain: number
}

// ------------------------------------------------------------------------------------------------
// Real-time HUD slot mapping (Phase 14, flip #5 — DORMANT until CLASS_KITS_ENABLED)
//
// The action-lite HUD (RealtimeBattle) and the turn-based BattleModal both expose three action slots:
// attack / counter / support. A kit has three abilities, but they don't line up 1:1 with those slots
// by KIND (notably guardian is strike+guard+counter with no heal/rally). This resolver maps a kit onto
// the three slots by ROLE, so every current class fills all three slots from DISTINCT abilities and no
// generic filler is needed:
//   • attack  = the class's strike (its damage identity)
//   • counter = its counter if it has one, else its guard  (the defensive/retaliation role)
//   • support = its heal or rally if it has one, else its *other* (still-unused) guard  (sustain/utility)
// Guardian therefore uses Retribution (counter) in the counter slot and Fortress (guard) in the support
// slot — no ability is dropped. Purely data; nothing consumes this until the engine/component wiring
// lands behind the flag. See docs/execution/DECISION_LOG.md D-017.
// ------------------------------------------------------------------------------------------------

export type RealtimeSlotId = 'attack' | 'counter' | 'support'

/** The kit ability bound to each real-time HUD slot for a class. */
export type KitSlotMapping = Record<RealtimeSlotId, KitAbility>

/**
 * Map a class kit onto the three HUD slots by role (see block comment). Deterministic; for every kit in
 * CLASS_KITS the three slots resolve to three distinct abilities.
 */
export function kitSlotMapping(classId: HeroClassId): KitSlotMapping {
  const abilities = getClassKit(classId).abilities
  const first = (pred: (a: KitAbility) => boolean) => abilities.find(pred)

  const attack = first((a) => a.kind === 'strike') ?? abilities[0]
  const counter = first((a) => a.kind === 'counter') ?? first((a) => a.kind === 'guard') ?? attack
  const support =
    first((a) => a.kind === 'heal') ??
    first((a) => a.kind === 'rally') ??
    first((a) => a.kind === 'guard' && a.id !== counter.id) ??
    first((a) => a.id !== attack.id && a.id !== counter.id) ??
    counter

  return { attack, counter, support }
}

/** Mechanical profile of a kit across the three balance axes. Derived purely from ability fields. */
export function kitProfile(classId: HeroClassId): KitProfile {
  let dps = 0
  let mitigation = 0
  let sustain = 0
  for (const a of getClassKit(classId).abilities) {
    const perSec = 1000 / a.cooldownMs
    if ((a.kind === 'strike' || a.kind === 'counter') && a.damageMultiplier) dps += a.damageMultiplier * perSec
    if ((a.kind === 'guard' || a.kind === 'counter') && a.incomingMultiplier !== undefined) mitigation += (1 - a.incomingMultiplier) * perSec
    if (a.kind === 'heal' && a.healBase) sustain += a.healBase * perSec
    if (a.kind === 'rally' && a.rallyValue) sustain += a.rallyValue * perSec
  }
  return { dps, mitigation, sustain }
}
