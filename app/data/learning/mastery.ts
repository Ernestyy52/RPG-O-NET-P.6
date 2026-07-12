// ================================================================================================
// SubskillMastery + MasteryUpdater (Phase 06)
//
// Tracks per-subskill proficiency for spaced review and reporting. This state is LEARNING ONLY —
// it is never read to scale combat power and combat stats never write it (ADR 0003, the learning
// ↔ combat firewall). Updates are pure and deterministic.
// ================================================================================================
import { DEFAULT_SCHEDULE, nextReviewAt, nextStability, type ScheduleConfig } from './scheduler'

export interface SubskillMastery {
  subskillId: string
  attempts: number
  correct: number
  /** exponential-moving proficiency in [0,1]. */
  mastery: number
  /** current spaced-review interval in ms (feeds nextReview). */
  stability: number
  /** epoch ms of the last answer. */
  lastSeen: number
  /** epoch ms when this subskill is next due for review. */
  nextReview: number
  /** running mean response time in ms. */
  avgResponseMs: number
  /** misconception tag → times observed. */
  misconceptions: Record<string, number>
  /** wrong answers given after the item had been well-known (mastery ≥ 0.6). */
  lapses: number
}

/** Learning rate for the mastery EMA. Higher ⇒ mastery reacts faster to recent answers. */
export const MASTERY_ALPHA = 0.3
/** Threshold above which a wrong answer counts as a "lapse". */
export const LAPSE_THRESHOLD = 0.6

export function newMastery(subskillId: string, now = 0): SubskillMastery {
  return {
    subskillId,
    attempts: 0,
    correct: 0,
    mastery: 0,
    stability: 0,
    lastSeen: 0,
    nextReview: now, // unseen items are immediately "due" so they get surfaced first
    avgResponseMs: 0,
    misconceptions: {},
    lapses: 0,
  }
}

export interface AnswerInput {
  correct: boolean
  responseMs?: number
  now?: number
  /** misconception tag (only recorded on a wrong answer). */
  misconception?: string
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Apply one answer to a subskill's mastery, returning a NEW mastery object (pure). Updates the EMA
 * proficiency, running response-time average, misconception/lapse counters, and the spaced-review
 * schedule. Does not touch any combat state.
 */
export function applyAnswer(m: SubskillMastery, input: AnswerInput, cfg: ScheduleConfig = DEFAULT_SCHEDULE): SubskillMastery {
  const now = input.now ?? m.lastSeen
  const attempts = m.attempts + 1
  const correct = m.correct + (input.correct ? 1 : 0)
  const target = input.correct ? 1 : 0
  const mastery = clamp01(m.mastery + MASTERY_ALPHA * (target - m.mastery))

  const rt = input.responseMs ?? m.avgResponseMs
  const avgResponseMs = m.attempts === 0 ? rt : (m.avgResponseMs * m.attempts + rt) / attempts

  const lapses = !input.correct && m.mastery >= LAPSE_THRESHOLD ? m.lapses + 1 : m.lapses

  const misconceptions = { ...m.misconceptions }
  if (!input.correct && input.misconception) {
    misconceptions[input.misconception] = (misconceptions[input.misconception] ?? 0) + 1
  }

  const stability = nextStability(m.stability, input.correct, mastery, cfg)
  const nextReview = nextReviewAt(now, stability)

  return { ...m, attempts, correct, mastery, avgResponseMs, lapses, misconceptions, stability, lastSeen: now, nextReview }
}

/** Convenience: get an existing mastery or a fresh one for a subskill. */
export function masteryOf(map: Record<string, SubskillMastery>, subskillId: string, now = 0): SubskillMastery {
  return map[subskillId] ?? newMastery(subskillId, now)
}

/** Weakness score in [0,1] — higher means the subskill needs more work. */
export function weaknessOf(m: SubskillMastery): number {
  return 1 - clamp01(m.mastery)
}
