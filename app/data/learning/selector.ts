// ================================================================================================
// QuestionSelector (Phase 06)
//
// Chooses the next question(s) to serve, drawing ONLY from content that passes the production rule
// (`selectableInProduction` — reviewed + valid). Selection weights weak and due subskills, boosts
// unseen subskills, and avoids recently-served questions (anti-repeat). Fully deterministic via an
// injected seeded RNG.
//
// Modes:
//   - 'learning-focus' strongly targets weak/due subskills (drilling).
//   - 'adventure' keeps a flatter distribution for variety while still nudging toward weak areas.
// ================================================================================================
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import { selectableInProduction } from '~/data/curriculum/validation'
import { masteryOf, weaknessOf, type SubskillMastery } from './mastery'
import { isDue } from './scheduler'

export type LearningMode = 'adventure' | 'learning-focus'

export interface SelectOptions {
  now: number
  mode: LearningMode
  rng: () => number
  /** ids to avoid (most-recent last). */
  recentIds?: string[]
  /** how many trailing recent ids to treat as blocked (default 5). */
  avoidRecent?: number
}

/** Relative weight of a question given the learner's mastery state and mode. Always > 0. */
export function questionWeight(
  q: CurriculumQuestion,
  masteryBySubskill: Record<string, SubskillMastery>,
  now: number,
  mode: LearningMode,
): number {
  const m = masteryOf(masteryBySubskill, q.subskillId, now)
  const focus = mode === 'learning-focus' ? 1 : 0
  const weakness = weaknessOf(m) // 0..1
  const due = isDue(m.nextReview, now) ? 1 : 0
  const unseen = m.attempts === 0 ? 1 : 0
  // learning-focus amplifies weakness/due; adventure stays flatter for variety.
  const w = 0.5 + weakness * (1 + 2 * focus) + due * (1.5 + 1.5 * focus) + unseen * 0.5
  return Math.max(0.05, w)
}

export function weightedPick<T>(items: { item: T; weight: number }[], rng: () => number): T | null {
  if (items.length === 0) return null
  const total = items.reduce((s, i) => s + i.weight, 0)
  if (total <= 0) return items[Math.floor(rng() * items.length)].item
  let r = rng() * total
  for (const it of items) {
    r -= it.weight
    if (r <= 0) return it.item
  }
  return items[items.length - 1].item
}

/** Pick a single question. Pure — does not mutate inputs. Returns null only for an empty pool. */
export function selectQuestion(
  pool: CurriculumQuestion[],
  masteryBySubskill: Record<string, SubskillMastery>,
  opts: SelectOptions,
): CurriculumQuestion | null {
  const selectable = selectableInProduction(pool)
  if (selectable.length === 0) return null

  const avoid = new Set((opts.recentIds ?? []).slice(-(opts.avoidRecent ?? 5)))
  let candidates = selectable.filter((q) => !avoid.has(q.id))
  if (candidates.length === 0) candidates = selectable // anti-repeat yields when the pool is too small

  const weighted = candidates.map((q) => ({ item: q, weight: questionWeight(q, masteryBySubskill, opts.now, opts.mode) }))
  return weightedPick(weighted, opts.rng)
}

/** Pick `count` questions with internal anti-repeat threading. Pure. */
export function selectQuestions(
  pool: CurriculumQuestion[],
  masteryBySubskill: Record<string, SubskillMastery>,
  count: number,
  opts: SelectOptions,
): CurriculumQuestion[] {
  const recent = [...(opts.recentIds ?? [])]
  const out: CurriculumQuestion[] = []
  for (let i = 0; i < count; i++) {
    const q = selectQuestion(pool, masteryBySubskill, { ...opts, recentIds: recent })
    if (!q) break
    out.push(q)
    recent.push(q.id)
  }
  return out
}
