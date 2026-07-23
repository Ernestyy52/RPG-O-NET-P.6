// ================================================================================================
// DailyLearningPlanGenerator (Phase 06)
//
// Builds a deterministic daily plan from the learner's mastery state. Supports 10/20/30-minute
// sessions and two modes (Adventure vs Learning Focus). Missed days are NON-PUNITIVE: a gap only
// grants a positive "rested" bonus of extra review slots and surfaces overdue items as catch-up —
// it never reduces the plan, rewards, or difficulty. Same date+seed ⇒ same plan.
// ================================================================================================
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import { selectableInProduction } from '~/data/curriculum/validation'
import { SUBSKILLS } from '~/data/curriculum/taxonomy'
import { masteryOf, weaknessOf, type SubskillMastery } from './mastery'
import { isDue } from './scheduler'
import { mulberry32, seedFromString } from './rng'
import { selectQuestions, type LearningMode } from './selector'

export type SessionLength = 10 | 20 | 30

/** Target questions per minute of study — tuned so a 20-min session ≈ 24 items. */
export const QUESTIONS_PER_MINUTE = 1.2

export interface PlanInput {
  date: string // YYYY-MM-DD
  minutes: SessionLength
  mode: LearningMode
  masteryBySubskill: Record<string, SubskillMastery>
  /** epoch ms "now" used for due checks; defaults to midnight of `date`. */
  now?: number
  /** overrides the seeded RNG (tests); defaults to a seed from date+mode. */
  rng?: () => number
  /** last day the learner studied (YYYY-MM-DD); undefined ⇒ first session. */
  lastSessionDate?: string
  /** upper bound on rested bonus slots. */
  maxRestedBonus?: number
}

export interface DailyPlan {
  date: string
  mode: LearningMode
  minutes: SessionLength
  targetQuestionCount: number
  questionIds: string[]
  subskillFocus: string[]
  /** number of selected questions whose subskill is currently due. */
  dueCount: number
  /** overdue items folded in as gentle catch-up (never a penalty). */
  catchUpCount: number
  /** positive bonus review slots granted after an absence (0 for first/consecutive days). */
  restedBonus: number
}

function parseDate(d: string): number {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, (m ?? 1) - 1, day ?? 1)
}

function daysBetween(a: string, b: string): number {
  return Math.round((parseDate(b) - parseDate(a)) / (24 * 60 * 60 * 1000))
}

/** Rank subskills by need (weakness + due), returning the top `count` ids. Deterministic. */
export function focusSubskills(masteryBySubskill: Record<string, SubskillMastery>, now: number, count: number): string[] {
  const scored = SUBSKILLS.map((s) => {
    const m = masteryOf(masteryBySubskill, s.id, now)
    const score = weaknessOf(m) + (isDue(m.nextReview, now) ? 0.75 : 0)
    return { id: s.id, score }
  })
  // stable sort: score desc, then id asc for determinism
  scored.sort((a, b) => (b.score - a.score) || a.id.localeCompare(b.id))
  return scored.slice(0, Math.max(1, count)).map((s) => s.id)
}

export function generateDailyPlan(pool: CurriculumQuestion[], input: PlanInput): DailyPlan {
  const now = input.now ?? parseDate(input.date)
  const rng = input.rng ?? mulberry32(seedFromString(`${input.date}:${input.mode}`))
  const maxRested = input.maxRestedBonus ?? 6

  // Non-punitive rested bonus: a gap of ≥2 days grants extra POSITIVE review slots (capped).
  const gap = input.lastSessionDate ? daysBetween(input.lastSessionDate, input.date) : 0
  const restedBonus = gap >= 2 ? Math.min(maxRested, (gap - 1) * 2) : 0

  const base = Math.round(input.minutes * QUESTIONS_PER_MINUTE)
  const targetQuestionCount = base + restedBonus

  // More minutes / learning-focus ⇒ a tighter focus set; adventure spreads wider for variety.
  const focusCount = input.mode === 'learning-focus'
    ? Math.max(3, Math.round(input.minutes / 5))
    : Math.max(4, Math.round(input.minutes / 3))
  const subskillFocus = focusSubskills(input.masteryBySubskill, now, focusCount)

  const selectable = selectableInProduction(pool)
  const questions = selectQuestions(selectable, input.masteryBySubskill, targetQuestionCount, {
    now,
    mode: input.mode,
    rng,
    avoidRecent: Math.max(1, Math.min(targetQuestionCount, selectable.length - 1)),
  })
  const questionIds = questions.map((q) => q.id)

  const dueCount = questions.filter((q) => isDue(masteryOf(input.masteryBySubskill, q.subskillId, now).nextReview, now)).length

  return {
    date: input.date,
    mode: input.mode,
    minutes: input.minutes,
    targetQuestionCount,
    questionIds,
    subskillFocus,
    dueCount,
    catchUpCount: dueCount, // due items are the catch-up load — additive, never punitive
    restedBonus,
  }
}
