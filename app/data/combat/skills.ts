// ================================================================================================
// Combat skill catalog (Phase 07, ADR 0002)
//
// The battle actions the hero can take and their costs — extracted from the inline constants and
// button handlers in BattleModal.vue. Damage multipliers feed `heroDamage`; retaliation multipliers
// scale the monster's follow-up hit after the skill resolves.
// ================================================================================================

export type CombatSkillId = 'attack' | 'support' | 'counter' | 'escape'

export interface SkillDefinition {
  id: CombatSkillId
  label: string
  /** MP spent to use the skill (0 = free). */
  mpCost: number
  /**
   * Base damage multiplier vs `heroDamage`. `undefined` for non-damaging actions. The plain attack
   * uses 1 here and adds the combo bonus on top (1 + comboBonus); see `heroActionMultiplier`.
   */
  damageMultiplier?: number
  /** Multiplier applied to the monster's follow-up hit after this skill (undefined ⇒ full 1×). */
  retaliationMultiplier?: number
}

/** MP cost of the Support skill (heal + steadies the next answer). */
export const SUPPORT_MP = 8
/** MP cost of the Counter skill (chip damage + softens the next hit). */
export const COUNTER_MP = 6
/** MP regained per correct answer (couples knowledge to the combat resource). */
export const CORRECT_ANSWER_MP_REGEN = 2

export const COMBAT_SKILLS: Record<CombatSkillId, SkillDefinition> = {
  attack: { id: 'attack', label: 'Attack', mpCost: 0, damageMultiplier: 1 },
  support: { id: 'support', label: 'Support', mpCost: SUPPORT_MP },
  counter: { id: 'counter', label: 'Counter', mpCost: COUNTER_MP, damageMultiplier: 0.65, retaliationMultiplier: 0.45 },
  escape: { id: 'escape', label: 'Escape', mpCost: 0 },
}

/**
 * Effective hero-damage multiplier for a skill. The plain attack scales with the current combo
 * (1 + comboBonus); other damaging skills use their fixed multiplier. Non-damaging skills ⇒ 0.
 */
export function heroActionMultiplier(skill: CombatSkillId, comboBonusValue: number): number {
  if (skill === 'attack') return 1 + comboBonusValue
  return COMBAT_SKILLS[skill].damageMultiplier ?? 0
}
