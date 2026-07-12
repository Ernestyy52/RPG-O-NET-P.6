// ================================================================================================
// Combat formulas (Phase 07, ADR 0002)
//
// Pure combat math extracted VERBATIM from `app/components/game/BattleModal.vue` and the damage seam
// in `app/stores/player.ts`. This is the single source of truth for every combat number — the UI and
// the store delegate here so a formula lives in exactly one place (no duplicated formula, ADR 0002).
//
// PURITY: no Vue/Phaser/Pinia imports, no `Math.random`, no clock. Given the same inputs these return
// the same outputs, so they are trivially unit-testable and safe for future server-authoritative use
// (constitution rule 9: clients are untrusted for online-critical combat).
// ================================================================================================

/** World combat modifiers — mirrors `getWorldState().combatModifier` from `app/data/world.ts`. */
export interface WorldCombatModifier {
  playerSpeed: number
  monsterAtk: number
  knowledge: number
}

/** Identity modifier for offline/deterministic contexts and tests. */
export const NEUTRAL_WORLD: WorldCombatModifier = { playerSpeed: 1, monsterAtk: 1, knowledge: 1 }

/** Combo damage bonus: +15% per stack after the first, capped at +60%. combo≤1 ⇒ 0. */
export function comboBonus(combo: number): number {
  return Math.min(0.6, Math.max(0, combo - 1) * 0.15)
}

/**
 * Hero attack damage. (atk + knowledge·0.6) scaled by an action multiplier and the world knowledge
 * modifier, floored at 3. Legacy: Math.max(3, Math.round((atk + knowledge*0.6) * mult * worldKnow)).
 */
export function heroDamage(atk: number, knowledge: number, multiplier: number, worldKnowledge = 1): number {
  return Math.max(3, Math.round((atk + knowledge * 0.6) * multiplier * worldKnowledge))
}

/** Monster raw attack for an action multiplier. `monsterAtk` is already world-scaled at setup. */
export function monsterDamage(monsterAtk: number, multiplier = 1): number {
  return Math.round(monsterAtk * multiplier)
}

/** Defense mitigation on incoming damage; always deals at least 1. Legacy: player.takeDamage seam. */
export function mitigateDamage(amount: number, def: number): number {
  return Math.max(1, Math.round(amount - def * 0.55))
}

/** Support-skill heal: base 14 + 2 per knowledge point. */
export function supportHeal(knowledge: number): number {
  return Math.round(14 + knowledge * 2)
}

/** Escape success chance, capped at 0.85 (caller compares against a random roll). */
export function escapeChance(speed: number): number {
  return Math.min(0.85, 0.35 + speed / 40)
}

/** Initiative: hero acts first when world-scaled speed meets or beats the monster's speed. */
export function heroWinsInitiative(playerSpeed: number, monsterSpeed: number, worldPlayerSpeed = 1): boolean {
  return playerSpeed * worldPlayerSpeed >= monsterSpeed
}

/** World-scaled monster attack, applied once at encounter setup. round(baseAtk * worldMonsterAtk). */
export function scaleMonsterAtk(baseAtk: number, worldMonsterAtk = 1): number {
  return Math.round(baseAtk * worldMonsterAtk)
}
