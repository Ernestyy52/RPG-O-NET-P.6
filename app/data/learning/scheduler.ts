// ================================================================================================
// ReviewScheduler — SM-2-lite spaced repetition (Phase 06)
//
// Pure functions operating on primitive values (no mastery-object import ⇒ no import cycle). A
// correct answer grows the review interval (scaled by mastery); a wrong answer resets it to the
// minimum so weak items resurface soon. Intervals are clamped to a sane range.
//
// Non-punitive by design: a missed day never shortens future intervals or adds penalties — overdue
// items simply become "due" and are surfaced by the selector/planner.
// ================================================================================================

export interface ScheduleConfig {
  /** shortest interval (also the reset interval after a wrong answer). */
  minIntervalMs: number
  /** longest interval a well-known item can reach. */
  maxIntervalMs: number
  /** peak growth multiplier at full mastery. */
  growth: number
  /** ease multiplier floor at zero mastery (keeps growth ≥ 1 even for weak items). */
  easeFloor: number
}

const MINUTE = 60 * 1000
const DAY = 24 * 60 * MINUTE

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  minIntervalMs: 10 * MINUTE,
  maxIntervalMs: 21 * DAY,
  growth: 2.5,
  easeFloor: 0.5,
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v))
}
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Next stability (interval in ms). Correct → grows from the previous interval by a mastery-scaled
 * multiplier (always ≥ 1, so it never shrinks on success); wrong → resets to the minimum.
 */
export function nextStability(prevStabilityMs: number, correct: boolean, mastery: number, cfg: ScheduleConfig = DEFAULT_SCHEDULE): number {
  if (!correct) return cfg.minIntervalMs
  const base = prevStabilityMs > 0 ? prevStabilityMs : cfg.minIntervalMs
  const ease = cfg.easeFloor + (1 - cfg.easeFloor) * clamp01(mastery) // easeFloor..1
  const mult = 1 + (cfg.growth - 1) * ease // 1..growth
  return clamp(cfg.minIntervalMs, cfg.maxIntervalMs, base * mult)
}

export function nextReviewAt(now: number, stabilityMs: number): number {
  return now + Math.max(0, stabilityMs)
}

export function isDue(nextReview: number, now: number): boolean {
  return now >= nextReview
}

/** How overdue an item is (0 when not yet due). Used to prioritize catch-up, never to penalize. */
export function overdueMs(nextReview: number, now: number): number {
  return Math.max(0, now - nextReview)
}
