// ================================================================================================
// Boss phase state machine (Phase 14, Increment 3) — PURE, framework-agnostic.
//
// The World-1 boss (Myco Colossus, floor 10) fights in three escalating phases. This module owns the
// phase model with the properties the Phase-14 gate ("readable boss phases") + no-soft-lock rule need,
// all unit-testable without a scene:
//   • Phase is DERIVED from HP fraction (thresholds 0.70 / 0.35) so it re-derives correctly after a
//     save/quit/resume mid-fight — no stored counter to desync (DECISION_LOG D-010).
//   • MONOTONIC: a heal never sends the boss back to an easier phase (advanceBossPhase floors at the
//     highest phase reached).
//   • IDEMPOTENT: crossing a threshold emits `boss-phase-change` exactly once; re-evaluating at the
//     same HP emits nothing (no double-trigger).
//   • READABILITY NEVER FALLS: as danger rises, tempo increases (attackIntervalMs decreases) but the
//     telegraph wind-up GROWS (telegraphMs increases, floor 600 ms) so a bigger hit is more readable.
//
// Live wiring into the real-time loop (emitting these events from RealtimeCombat.tick against the boss
// HP, and rendering the telegraph in BossScene) is the browser-verified part of Increment 3 and is
// deferred to a dev-server session; this module + its tests are the verifiable foundation.
// ================================================================================================

export type BossPhaseId = 1 | 2 | 3
export type BossAttackPattern = 'single' | 'double' | 'aoe-slam'

export interface BossPhaseSpec {
  id: BossPhaseId
  /** ms between boss attacks in this phase (tempo — decreases as danger rises). */
  attackIntervalMs: number
  /** damage multiplier applied to the boss's hit in this phase. */
  damageMod: number
  pattern: BossAttackPattern
  /** wind-up telegraph duration (ms) before the hit lands — GROWS with danger, floor 600. */
  telegraphMs: number
  /** phase colour used by the arena/boss tint + HP-bar marker (one of three readable channels). */
  tint: number
  name: string
  nameTh: string
}

export interface BossPhaseConfig {
  /** HP fractions entering phase 2 and phase 3, descending, in (0,1). */
  thresholds: [number, number]
  phases: [BossPhaseSpec, BossPhaseSpec, BossPhaseSpec]
}

export interface BossPhaseState {
  /** highest phase reached so far (monotonic). */
  phase: BossPhaseId
}

export type BossPhaseEvent =
  | { type: 'boss-phase-change'; phase: BossPhaseId; spec: BossPhaseSpec }
  | { type: 'boss-telegraph'; phase: BossPhaseId; pattern: BossAttackPattern; telegraphMs: number }

/** Minimum readable telegraph wind-up. A phase below this fails `validateBossPhaseConfig`. */
export const MIN_TELEGRAPH_MS = 600

// ---- World-1 boss: Myco Colossus --------------------------------------------------------------

export const MYCO_COLOSSUS_PHASES: BossPhaseConfig = {
  thresholds: [0.7, 0.35],
  phases: [
    { id: 1, attackIntervalMs: 1600, damageMod: 1.0, pattern: 'single', telegraphMs: 600, tint: 0x8fd18f, name: 'Awakening', nameTh: 'ตื่นจากหลับใหล' },
    { id: 2, attackIntervalMs: 1300, damageMod: 1.15, pattern: 'double', telegraphMs: 800, tint: 0xd8c25a, name: 'Sporestorm', nameTh: 'พายุสปอร์' },
    { id: 3, attackIntervalMs: 1000, damageMod: 1.3, pattern: 'aoe-slam', telegraphMs: 1000, tint: 0xd15a5a, name: 'Last Bloom', nameTh: 'ผลิบานครั้งสุดท้าย' },
  ],
}

// ---- pure logic --------------------------------------------------------------------------------

export function bossPhaseSpec(config: BossPhaseConfig, phase: BossPhaseId): BossPhaseSpec {
  return config.phases[phase - 1]
}

/**
 * The phase a given HP fraction alone implies (the monotonic floor used on resume). Phase 2 at ≤70%,
 * phase 3 at ≤35%. Clamped so out-of-range fractions never throw.
 */
export function phaseForHpFraction(config: BossPhaseConfig, hpFraction: number): BossPhaseId {
  const f = Math.max(0, Math.min(1, hpFraction))
  if (f <= config.thresholds[1]) return 3
  if (f <= config.thresholds[0]) return 2
  return 1
}

/** Fresh state at the START of a fight or re-derived on resume — phase floored to what HP implies. */
export function initBossPhaseState(config: BossPhaseConfig, hpFraction = 1): BossPhaseState {
  return { phase: phaseForHpFraction(config, hpFraction) }
}

export interface AdvanceResult {
  state: BossPhaseState
  events: BossPhaseEvent[]
}

/**
 * Fold the current HP fraction into the phase state. The phase only ever advances (monotonic); each
 * advance emits a single `boss-phase-change` plus the new phase's `boss-telegraph`. Re-calling at the
 * same or higher HP is a no-op (idempotent, no double-trigger). Returns a NEW state (pure).
 */
export function advanceBossPhase(state: BossPhaseState, config: BossPhaseConfig, hpFraction: number): AdvanceResult {
  const implied = phaseForHpFraction(config, hpFraction)
  const next = Math.max(state.phase, implied) as BossPhaseId
  if (next === state.phase) return { state: { phase: state.phase }, events: [] }
  const spec = bossPhaseSpec(config, next)
  return {
    state: { phase: next },
    events: [
      { type: 'boss-phase-change', phase: next, spec },
      { type: 'boss-telegraph', phase: next, pattern: spec.pattern, telegraphMs: spec.telegraphMs },
    ],
  }
}

/** The telegraph to raise before the boss's next attack in the current phase (each wind-up). */
export function bossTelegraph(state: BossPhaseState, config: BossPhaseConfig): BossPhaseEvent {
  const spec = bossPhaseSpec(config, state.phase)
  return { type: 'boss-telegraph', phase: state.phase, pattern: spec.pattern, telegraphMs: spec.telegraphMs }
}

/**
 * Structural invariants a boss config must satisfy. Returns the list of problems (empty = valid) so a
 * unit test can assert readability/monotonicity by construction rather than by eyeballing the numbers.
 */
export function validateBossPhaseConfig(config: BossPhaseConfig): string[] {
  const problems: string[] = []
  const [t2, t3] = config.thresholds
  if (!(t2 > t3)) problems.push('thresholds must be descending (phase-2 > phase-3)')
  if (!(t2 < 1 && t2 > 0)) problems.push('phase-2 threshold must be in (0,1)')
  if (!(t3 < 1 && t3 > 0)) problems.push('phase-3 threshold must be in (0,1)')
  for (let i = 0; i < config.phases.length; i++) {
    const p = config.phases[i]
    if (p.id !== i + 1) problems.push(`phase ${i + 1} has wrong id ${p.id}`)
    if (p.telegraphMs < MIN_TELEGRAPH_MS) problems.push(`phase ${p.id} telegraph ${p.telegraphMs}ms below floor ${MIN_TELEGRAPH_MS}ms`)
    if (i > 0) {
      const prev = config.phases[i - 1]
      if (p.telegraphMs < prev.telegraphMs) problems.push(`phase ${p.id} telegraph shrinks (readability must not fall)`)
      if (p.attackIntervalMs > prev.attackIntervalMs) problems.push(`phase ${p.id} slower than previous (tempo must not fall)`)
      if (p.damageMod < prev.damageMod) problems.push(`phase ${p.id} weaker than previous (danger must not fall)`)
    }
  }
  return problems
}
