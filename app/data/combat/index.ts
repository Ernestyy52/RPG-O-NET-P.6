// ================================================================================================
// Combat domain barrel (Phase 07, ADR 0002)
//
// Public surface of the pure combat domain. Import combat math/types/rewards from here.
//
// FEATURE FLAG: COMBAT_DOMAIN_ENABLED gates whether BattleModal drives combat through the domain
// ENGINE (resolveHeroSkill / resolveMonsterAttack / setupEncounter) rather than computing turns
// inline. Formulas live only in this domain in BOTH flag states — the flag is purely the rollback
// lever for the new turn-orchestration path (constitution rule 6: refactor behind a flag, keep the
// legacy path until the phase gate passes). Flip to true only after the engine path is verified in a
// running dev server.
// ================================================================================================

/** Rollback flag for the engine-driven turn loop in BattleModal. Legacy path stays authoritative until true. */
export const COMBAT_DOMAIN_ENABLED = true

/**
 * Rollback flag for the real-time action-lite combat loop (Phase 09). Dormant — the turn-based
 * BattleModal remains authoritative until a rendered real-time scene passes the World 1 gate.
 */
export const REALTIME_COMBAT_ENABLED = true

export * from './formulas'
export * from './skills'
export * from './engine'
export * from './rewards'
export * from './realtime'
export * from './classKits'
export * from './bossPhases'
export type {
  RuntimeStats, Resource, StatusEffect, Cooldown, CombatActor,
  DamageRequest, DamageResult, CombatEvent,
} from './types'
