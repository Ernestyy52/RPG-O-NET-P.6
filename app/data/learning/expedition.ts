// ================================================================================================
// Adaptive Daily Expeditions (Phase 11)
//
// Turns the Phase 06 daily learning plan into a themed, multi-objective "expedition" for the day. An
// expedition is the adventure wrapper around the plan: each objective is tied to REAL content — a weak
// subskill to shore up, the review backlog to clear, language areas to range across, an accuracy goal,
// and a capstone — never a bare "answer N questions" counter (no numeric-only filler).
//
// Phase 11 gate properties, by construction:
//  • Plans vary meaningfully. Objectives are derived from the learner's weakest/most-due subskills and
//    a date-seeded title, so different mastery or different days yield different expeditions.
//  • Missed days don't punish. The plan's non-punitive rested bonus adds EXTRA bonus objectives after
//    an absence; nothing is ever removed and there is no "streak broken" penalty.
//  • Objectives completable & deterministic. Targets are bounded by the content actually available
//    (an objective is only added when its subskill/domain exists in the reviewed pool), and
//    evaluateExpedition() maps progress→completion purely.
//  • No numeric-only filler. Every objective has a content-tied description and a distinct kind.
//  • Fallback. With no reviewed content, generateExpedition returns a shallow-counter fallback
//    expedition (fallback:true) the caller can route to the legacy daily quests.
// ================================================================================================
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import { selectableInProduction } from '~/data/curriculum/validation'
import { getSubskill, type OnetDomain } from '~/data/curriculum/taxonomy'
import { mulberry32, seedFromString } from './rng'
import { generateDailyPlan, type PlanInput, type DailyPlan } from './planner'

/** Rollback flag (Phase 11 → Phase 14 flip #7). LIVE: the Guild serves the day's adaptive expedition;
 *  legacy daily quests remain the explicit fallback (no reviewed content ⇒ fallback:true). */
export const ADAPTIVE_EXPEDITIONS_ENABLED = true

export type ExpeditionObjectiveKind =
  | 'weak-skill-drill'
  | 'review-due'
  | 'domain-variety'
  | 'accuracy'
  | 'capstone'

export interface ObjectiveReward {
  exp: number
  gold: number
  gems: number
}

export interface ExpeditionObjective {
  id: string
  kind: ExpeditionObjectiveKind
  /** human, content-tied description — never "answer N questions". */
  description: string
  subskillId?: string
  domain?: OnetDomain
  /** completion threshold (a count, a distinct-area count, or an accuracy percentage). */
  target: number
  reward: ObjectiveReward
  /** granted by the rested bonus after an absence — additive, never a penalty. */
  bonus: boolean
}

export interface Expedition {
  date: string
  title: string
  mode: DailyPlan['mode']
  minutes: DailyPlan['minutes']
  /** the day's plan question set (what the objectives are practiced on). */
  planQuestionIds: string[]
  subskillFocus: string[]
  objectives: ExpeditionObjective[]
  restedBonus: number
  /** true when built without reviewed content ⇒ caller should use the legacy shallow daily quests. */
  fallback: boolean
}

/** Minimum accuracy (%) for the accuracy objective. */
export const ACCURACY_TARGET = 70

const EXPEDITION_TITLES = [
  'The Whispering Archive', 'Lanternlight Expedition', 'The Sunken Lexicon',
  'Trail of the Verb Wardens', 'The Clockwork Reading Room', 'Passage of Polite Words',
  'The Cartographer\'s Riddle', 'Ember Hollow Study',
]

function objectiveReward(kind: ExpeditionObjectiveKind, target: number): ObjectiveReward {
  switch (kind) {
    case 'weak-skill-drill': return { exp: 20 + target * 6, gold: 10 + target * 3, gems: 0 }
    case 'review-due': return { exp: 15 + target * 5, gold: 8 + target * 3, gems: 0 }
    case 'domain-variety': return { exp: 25 + target * 8, gold: 12 + target * 4, gems: 0 }
    case 'accuracy': return { exp: 40, gold: 20, gems: 0 }
    case 'capstone': return { exp: 60, gold: 30, gems: 1 }
  }
}

function drillObjective(subskillId: string, target: number, bonus: boolean): ExpeditionObjective {
  const sub = getSubskill(subskillId)
  const name = sub?.name ?? subskillId
  return {
    id: `weak-skill-drill:${subskillId}${bonus ? ':bonus' : ''}`,
    kind: 'weak-skill-drill',
    description: `Drill "${name}" — answer ${target} correctly to shore up this weak spot.`,
    subskillId,
    domain: sub?.domain,
    target,
    reward: objectiveReward('weak-skill-drill', target),
    bonus,
  }
}

export interface ExpeditionInput extends PlanInput {
  /** upper bound on bonus drill objectives granted after an absence. */
  maxBonusObjectives?: number
}

/** Build the day's expedition from the learning plan. Deterministic for a given input. */
export function generateExpedition(pool: CurriculumQuestion[], input: ExpeditionInput): Expedition {
  const plan = generateDailyPlan(pool, input)
  const selectable = selectableInProduction(pool)
  const titleRng = mulberry32(seedFromString(`${input.date}:${input.mode}:expedition`))
  const title = EXPEDITION_TITLES[Math.floor(titleRng() * EXPEDITION_TITLES.length)]

  // Fallback: no reviewed content ⇒ hand back a shallow expedition the caller routes to legacy quests.
  if (selectable.length === 0) {
    return {
      date: input.date, title, mode: input.mode, minutes: input.minutes,
      planQuestionIds: [], subskillFocus: plan.subskillFocus,
      objectives: [{
        id: 'fallback:practice', kind: 'weak-skill-drill',
        description: 'Practice today\'s questions to keep your skills sharp.',
        target: 5, reward: objectiveReward('weak-skill-drill', 5), bonus: false,
      }],
      restedBonus: plan.restedBonus, fallback: true,
    }
  }

  const availableSubskills = new Set(selectable.map((q) => q.subskillId))
  const availableDomains = new Set<OnetDomain>()
  for (const q of selectable) {
    const d = getSubskill(q.subskillId)?.domain
    if (d) availableDomains.add(d)
  }

  const objectives: ExpeditionObjective[] = []

  // 1) Base weak-skill drills — the two weakest focus subskills that actually have content.
  const drillable = plan.subskillFocus.filter((id) => availableSubskills.has(id))
  for (const subskillId of drillable.slice(0, 2)) {
    objectives.push(drillObjective(subskillId, 3, false))
  }

  // 2) Review backlog — only when there is a real due load (never filler).
  if (plan.dueCount > 0) {
    const target = Math.min(plan.dueCount, 5)
    objectives.push({
      id: 'review-due', kind: 'review-due',
      description: `Clear your review backlog — complete ${target} due review${target > 1 ? 's' : ''}.`,
      target, reward: objectiveReward('review-due', target), bonus: false,
    })
  }

  // 3) Range across language areas — only when at least two domains are available.
  if (availableDomains.size >= 2) {
    const target = Math.min(availableDomains.size, 4)
    objectives.push({
      id: 'domain-variety', kind: 'domain-variety',
      description: `Range widely — practice across ${target} language areas today.`,
      target, reward: objectiveReward('domain-variety', target), bonus: false,
    })
  }

  // 4) Quality gate — a meaningful accuracy goal, not a count.
  objectives.push({
    id: 'accuracy', kind: 'accuracy',
    description: `Sharp focus — keep your accuracy at ${ACCURACY_TARGET}% or better this expedition.`,
    target: ACCURACY_TARGET, reward: objectiveReward('accuracy', ACCURACY_TARGET), bonus: false,
  })

  // 5) Capstone — a narrative finish, the day's knowledge challenge.
  objectives.push({
    id: 'capstone', kind: 'capstone',
    description: 'Capstone — finish with the day\'s knowledge challenge.',
    target: 1, reward: objectiveReward('capstone', 1), bonus: false,
  })

  // 6) Rested bonus (missed days) ⇒ EXTRA drill objectives on further weak spots. Additive only.
  if (plan.restedBonus > 0) {
    const maxBonus = input.maxBonusObjectives ?? 2
    const bonusCount = Math.min(maxBonus, Math.ceil(plan.restedBonus / 3))
    const extra = drillable.slice(2, 2 + bonusCount)
    for (const subskillId of extra) objectives.push(drillObjective(subskillId, 2, true))
  }

  return {
    date: input.date, title, mode: input.mode, minutes: input.minutes,
    planQuestionIds: plan.questionIds, subskillFocus: plan.subskillFocus,
    objectives, restedBonus: plan.restedBonus, fallback: false,
  }
}

export interface ExpeditionProgress {
  /** correct-answer count per subskill. */
  correctBySubskill?: Record<string, number>
  /** number of due-for-review items cleared. */
  dueCleared?: number
  /** distinct domains practiced. */
  domainsPracticed?: OnetDomain[]
  /** overall accuracy in [0,1]. */
  accuracy?: number
  /** whether the capstone challenge was completed. */
  capstoneCleared?: boolean
}

function objectiveComplete(o: ExpeditionObjective, p: ExpeditionProgress): boolean {
  switch (o.kind) {
    case 'weak-skill-drill': return (p.correctBySubskill?.[o.subskillId ?? ''] ?? 0) >= o.target
    case 'review-due': return (p.dueCleared ?? 0) >= o.target
    case 'domain-variety': return (p.domainsPracticed?.length ?? 0) >= o.target
    case 'accuracy': return Math.round((p.accuracy ?? 0) * 100) >= o.target
    case 'capstone': return p.capstoneCleared === true
  }
}

export interface ExpeditionResult {
  objectives: { id: string; complete: boolean }[]
  completedCount: number
  allComplete: boolean
  /** summed reward of the COMPLETED objectives only. */
  rewardTotal: ObjectiveReward
}

/** Evaluate expedition completion against progress. Pure & deterministic. */
export function evaluateExpedition(expedition: Expedition, progress: ExpeditionProgress): ExpeditionResult {
  const objectives = expedition.objectives.map((o) => ({ id: o.id, complete: objectiveComplete(o, progress) }))
  const rewardTotal = expedition.objectives.reduce<ObjectiveReward>((acc, o, i) => {
    if (!objectives[i].complete) return acc
    return { exp: acc.exp + o.reward.exp, gold: acc.gold + o.reward.gold, gems: acc.gems + o.reward.gems }
  }, { exp: 0, gold: 0, gems: 0 })
  const completedCount = objectives.filter((o) => o.complete).length
  return { objectives, completedCount, allComplete: completedCount === expedition.objectives.length, rewardTotal }
}
