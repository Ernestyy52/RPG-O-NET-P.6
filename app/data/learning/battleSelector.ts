// ================================================================================================
// Battle question selector (S-grade learning pass)
//
// Serves battle questions weighted toward the learner's WEAK and DUE subskills (the Phase-06
// "weak-recur" property) instead of the mastery-blind shuffle-bag, while still respecting the
// floor's CEFR tier and difficulty curve. Selection draws ONLY from production-selectable content
// (reviewed + valid). Pure core (injectable now/rng) + a small stateful draw helper that mirrors
// the legacy module-level anti-repeat pattern in app/data/questions.ts.
//
// Firewall note (ADR 0003): mastery here only biases WHICH question appears — it never scales
// combat numbers. Flag-gated per constitution rule 6; flag off ⇒ callers fall back to the legacy
// getQuestionsForDifficulty path, byte-identical.
// ================================================================================================
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import { selectableInProduction } from '~/data/curriculum/validation'
import { cefrForFloor } from '~/data/questions'
import { questionWeight, weightedPick } from './selector'
import type { SubskillMastery } from './mastery'

/** Flip: battles pick questions by mastery-weakness + spaced-review dueness. Legacy path retained. */
export const MASTERY_BATTLE_SELECTION_ENABLED = true

export interface BattleSelectOptions {
  floor: number
  /** target difficulty from the floor curve (1..5). */
  difficulty: number
  mastery: Record<string, SubskillMastery>
  now: number
  rng: () => number
  /** ids to avoid (most-recent last). */
  recentIds?: string[]
}

/**
 * Pick one battle question: floor-tier pool → production-selectable → anti-repeat → weighted by
 * (weakness/dueness via questionWeight in 'adventure' mode) × (difficulty proximity). Pure.
 */
export function selectBattleQuestion(
  pool: CurriculumQuestion[],
  opts: BattleSelectOptions,
): CurriculumQuestion | null {
  const tier = cefrForFloor(opts.floor)
  const tierPool = pool.filter((q) => q.cefr === tier)
  const selectable = selectableInProduction(tierPool.length ? tierPool : pool)
  if (selectable.length === 0) return null

  // anti-repeat window ~⅓ of the tier pool so a full tier still cycles with variety
  const windowSize = Math.max(5, Math.floor(selectable.length / 3))
  const avoid = new Set((opts.recentIds ?? []).slice(-windowSize))
  let candidates = selectable.filter((q) => !avoid.has(q.id))
  if (candidates.length === 0) candidates = selectable

  const weighted = candidates.map((q) => ({
    item: q,
    // adventure mode = flatter mastery bias (variety first, weakness still nudges), then pull
    // toward the floor's difficulty band so floor progression keeps its curve.
    weight: questionWeight(q, opts.mastery, opts.now, 'adventure') / (1 + Math.abs(q.difficulty - opts.difficulty)),
  }))
  return weightedPick(weighted, opts.rng)
}

// ---- stateful draw helper for the battle UIs (module-level anti-repeat, like the legacy bag) ----
const recentBattleIds: string[] = []

export function drawBattleQuestion(
  pool: CurriculumQuestion[],
  floor: number,
  difficulty: number,
  mastery: Record<string, SubskillMastery>,
  now: number = Date.now(),
  rng: () => number = Math.random,
): CurriculumQuestion | null {
  const q = selectBattleQuestion(pool, { floor, difficulty, mastery, now, rng, recentIds: recentBattleIds })
  if (q) {
    recentBattleIds.push(q.id)
    if (recentBattleIds.length > 60) recentBattleIds.shift()
  }
  return q
}
