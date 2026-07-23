// ================================================================================================
// Combat domain model (Phase 07, ADR 0002)
//
// Vocabulary for the extracted combat domain. These types describe combat state WITHOUT any Vue,
// Phaser, or Pinia coupling so the same model can drive the current turn-based BattleModal today and
// server-authoritative real-time combat later (roadmap Phase 09). Learning/mastery state is
// deliberately absent here — mastery never scales combat power (ADR 0003, the learning↔combat firewall).
// ================================================================================================

/** Derived combat stats for an actor (mirror of the player store `stats` getter shape). */
export interface RuntimeStats {
  maxHp: number
  atk: number
  def: number
  speed: number
  knowledge: number
}

/** A bounded pool such as MP. */
export interface Resource {
  current: number
  max: number
}

/**
 * A transient combat modifier. `incomingMultiplier` scales the next hit the bearer takes (e.g. the
 * Counter stance sets 0.45); `turns` counts down, 1 meaning "affects only the next action".
 */
export interface StatusEffect {
  id: string
  incomingMultiplier?: number
  turns: number
}

/** Remaining lockout on a skill (for future real-time combat; turn combat leaves this empty). */
export interface Cooldown {
  skillId: string
  remaining: number
}

/** A combatant snapshot. The adapter builds this from the player store / encounter payload. */
export interface CombatActor {
  id: string
  name: string
  hp: number
  stats: RuntimeStats
  mp?: Resource
  statuses: StatusEffect[]
  cooldowns: Cooldown[]
}

/** Input to a damage calculation. */
export interface DamageRequest {
  /** raw damage before target mitigation. */
  amount: number
  /** target's defense (0 for monsters — they have no def mitigation in the current model). */
  targetDef: number
  /** target's current HP. */
  targetHp: number
}

/** Result of applying damage — raw vs. mitigated vs. resulting HP (never below 0). */
export interface DamageResult {
  raw: number
  applied: number
  targetHpAfter: number
}

/** Something that happened during a turn, for the battle log / animations. */
export type CombatEvent =
  | { type: 'hero-attack'; damage: number; combo: number; comboBonus: number }
  | { type: 'hero-counter'; damage: number }
  | { type: 'hero-support'; heal: number }
  | { type: 'hero-wrong' }
  | { type: 'monster-attack'; damage: number; multiplier: number }
  | { type: 'monster-defeated' }
  | { type: 'hero-defeated' }
  | { type: 'escaped'; success: boolean }
