// ================================================================================================
// Rested Bonus (Master Plan Phase 8 — Ethical Retention)
//
// The RETURN system on the game side: time away GRANTS a capped pool of bonus combat EXP — it never
// takes anything. This is the explicit replacement for a punitive streak (roadmap: "rested bonus
// แทน punitive streak"): a student who skips days loses nothing and comes back slightly faster,
// so returning always feels good and absence is never punished.
//
// Learning-side rested bonus lives separately in learning/planner.ts (extra review slots) and
// learning/expedition.ts (bonus objectives) — ADR 0003: learning state ≠ combat power. This pool
// only accelerates combat EXP, never mastery.
//
// Pure module: all functions are deterministic on their inputs (callers pass timestamps).
// ================================================================================================

/** Rollback flag (house style — additive feature ships behind a flag). */
export const RESTED_BONUS_ENABLED = true

/** Minimum absence before rest accrues (a school night away counts, a lunch break doesn't). */
export const RESTED_MIN_GAP_HOURS = 8
/** Fraction of one level's EXP accrued per 24 h away. */
export const RESTED_RATE_PER_DAY = 0.25
/** Pool ceiling as a fraction of one level's EXP (reached after ~4 days away — longer adds nothing). */
export const RESTED_CAP_LEVELS = 1
/** While the pool lasts, combat EXP is boosted by this fraction (+50%), drawn from the pool. */
export const RESTED_MULTIPLIER = 0.5

export const MS_PER_HOUR = 3_600_000

/**
 * Pool gained for an absence of `hoursAway`, in EXP points, where `expPerLevel` is the EXP the
 * player needs for their next level. Below the minimum gap ⇒ 0. Linear in time, capped.
 */
export function restedGainFor(hoursAway: number, expPerLevel: number): number {
  if (!Number.isFinite(hoursAway) || hoursAway < RESTED_MIN_GAP_HOURS) return 0
  const fraction = Math.min((hoursAway / 24) * RESTED_RATE_PER_DAY, RESTED_CAP_LEVELS)
  return Math.max(0, Math.round(expPerLevel * fraction))
}

/**
 * Fold a new absence into an existing pool. Additive but capped at one level's EXP so stockpiling
 * across many absences can't dominate progression. Never returns less than the smaller of the
 * inputs' cap — i.e., never negative, never a penalty.
 */
export function accrueRested(prevPool: number, hoursAway: number, expPerLevel: number): number {
  const cap = Math.round(expPerLevel * RESTED_CAP_LEVELS)
  const safePrev = Math.max(0, Math.floor(prevPool) || 0)
  return Math.min(cap, safePrev + restedGainFor(hoursAway, expPerLevel))
}

/**
 * Spend the pool against a base combat-EXP gain: the bonus is +50% of the base, limited by what the
 * pool still holds. Returns the bonus EXP to add and the remaining pool. Pure; never negative.
 */
export function consumeRested(pool: number, baseExp: number): { bonus: number; remaining: number } {
  const safePool = Math.max(0, Math.floor(pool) || 0)
  const safeBase = Math.max(0, Math.floor(baseExp) || 0)
  const bonus = Math.min(safePool, Math.round(safeBase * RESTED_MULTIPLIER))
  return { bonus, remaining: safePool - bonus }
}

/** Hours between two ms-epoch timestamps, clamped to ≥0 (a clock that went backwards grants 0). */
export function hoursBetween(earlierMs: number, laterMs: number): number {
  if (!Number.isFinite(earlierMs) || !Number.isFinite(laterMs) || earlierMs <= 0) return 0
  return Math.max(0, (laterMs - earlierMs) / MS_PER_HOUR)
}
