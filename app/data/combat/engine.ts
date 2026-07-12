// ================================================================================================
// Combat engine (Phase 07, ADR 0002)
//
// Turn resolution built on the pure formulas — encounter setup, initiative, and hero/monster action
// resolution returning DamageResults. No Vue/Phaser/store imports and no randomness (escape rolls and
// loot stay with the caller so the engine is deterministic and testable). BattleModal drives this
// when the `combatDomain` flag is on; behaviour is identical to the legacy inline path.
// ================================================================================================
import {
  comboBonus, heroDamage, mitigateDamage, monsterDamage, scaleMonsterAtk,
  type WorldCombatModifier, NEUTRAL_WORLD,
} from './formulas'
import { heroActionMultiplier, type CombatSkillId } from './skills'
import type { DamageResult } from './types'

/** Monster/encounter stats resolved from an encounter payload + floor config (mirror of setupMonster). */
export interface EncounterSetup {
  name: string
  maxHp: number
  atk: number
  speed: number
  isBoss: boolean
  expReward: number
  goldReward: number
}

/** Minimal floor-config shape the engine reads (subset of FloorConfig). */
export interface FloorDefaults {
  monsterHp: number
  monsterAtk: number
  monsterLevel: number
  expReward: number
  goldReward: number
}

/** Encounter payload shape (subset of EncounterInfo) used to override floor defaults. */
export interface EncounterPayload {
  isBoss?: boolean
  name?: string
  hp?: number
  atk?: number
  speed?: number
  expReward?: number
  goldReward?: number
}

/**
 * Resolve concrete monster stats for an encounter — reproduces BattleModal.setupMonster exactly:
 * payload overrides floor defaults, monster atk is world-scaled once, bosses gain +4 speed.
 */
export function setupEncounter(
  payload: EncounterPayload,
  cfg: FloorDefaults,
  world: WorldCombatModifier = NEUTRAL_WORLD,
): EncounterSetup {
  const isBoss = !!payload.isBoss
  return {
    isBoss,
    name: payload.name ?? (isBoss ? 'Floor Boss' : 'Dungeon Monster'),
    maxHp: Math.round(payload.hp ?? cfg.monsterHp),
    atk: scaleMonsterAtk(payload.atk ?? cfg.monsterAtk, world.monsterAtk),
    speed: (payload.speed ?? cfg.monsterLevel) + (isBoss ? 4 : 0),
    expReward: payload.expReward ?? cfg.expReward,
    goldReward: payload.goldReward ?? cfg.goldReward,
  }
}

export interface HeroActionContext {
  atk: number
  knowledge: number
  /** current combo count (only the plain attack consumes it). */
  combo: number
  monsterHp: number
  world?: WorldCombatModifier
}

/**
 * Resolve a hero damaging action (attack / counter) against the monster. Non-damaging skills return a
 * zero result. The plain attack folds in the current combo bonus; counter uses its fixed multiplier.
 */
export function resolveHeroSkill(skill: CombatSkillId, ctx: HeroActionContext): DamageResult {
  const world = ctx.world ?? NEUTRAL_WORLD
  const multiplier = heroActionMultiplier(skill, comboBonus(ctx.combo))
  const raw = multiplier > 0 ? heroDamage(ctx.atk, ctx.knowledge, multiplier, world.knowledge) : 0
  return { raw, applied: raw, targetHpAfter: Math.max(0, ctx.monsterHp - raw) }
}

export interface MonsterActionContext {
  monsterAtk: number
  /** follow-up multiplier (e.g. 0.45 after a counter, 1 otherwise). */
  multiplier?: number
  heroHp: number
  heroDef: number
}

/** Resolve a monster attack against the hero, applying defense mitigation (min 1 damage). */
export function resolveMonsterAttack(ctx: MonsterActionContext): DamageResult {
  const raw = monsterDamage(ctx.monsterAtk, ctx.multiplier ?? 1)
  const applied = mitigateDamage(raw, ctx.heroDef)
  return { raw, applied, targetHpAfter: Math.max(0, ctx.heroHp - applied) }
}
