// ================================================================================================
// LearningSessionSummary (Phase 06)
//
// Aggregates a session's answers into per-subskill mastery movement, misconceptions, upcoming
// reviews, and encouraging (non-punitive) recommendations. Returns the updated mastery map so it can
// be persisted into the learning save slice. Pure & deterministic.
// ================================================================================================
import { getSubskill } from '~/data/curriculum/taxonomy'
import { applyAnswer, masteryOf, type SubskillMastery } from './mastery'
import { isDue } from './scheduler'

export interface AnswerRecord {
  subskillId: string
  correct: boolean
  responseMs?: number
  misconception?: string
  questionId?: string
}

export interface SubskillMovement {
  subskillId: string
  attempts: number
  correct: number
  accuracy: number
  masteryBefore: number
  masteryAfter: number
  delta: number
}

export interface SessionSummary {
  totalAnswered: number
  totalCorrect: number
  accuracy: number
  perSubskill: SubskillMovement[]
  misconceptions: Record<string, number>
  recommendations: string[]
  /** subskills due for review within the next day. */
  dueSoonSubskills: string[]
}

const DAY = 24 * 60 * 60 * 1000

/** Apply a session's records to a COPY of the mastery map and produce a summary. */
export function summarizeSession(
  masteryBefore: Record<string, SubskillMastery>,
  records: AnswerRecord[],
  now: number,
): { summary: SessionSummary; masteryAfter: Record<string, SubskillMastery> } {
  const after: Record<string, SubskillMastery> = { ...masteryBefore }
  const before: Record<string, number> = {}
  const perSubskillAcc: Record<string, { attempts: number; correct: number }> = {}
  const misconceptions: Record<string, number> = {}

  for (const r of records) {
    if (before[r.subskillId] === undefined) before[r.subskillId] = masteryOf(masteryBefore, r.subskillId, now).mastery
    const current = masteryOf(after, r.subskillId, now)
    after[r.subskillId] = applyAnswer(current, { correct: r.correct, responseMs: r.responseMs, now, misconception: r.misconception })
    const acc = (perSubskillAcc[r.subskillId] ??= { attempts: 0, correct: 0 })
    acc.attempts++
    if (r.correct) acc.correct++
    if (!r.correct && r.misconception) misconceptions[r.misconception] = (misconceptions[r.misconception] ?? 0) + 1
  }

  const perSubskill: SubskillMovement[] = Object.keys(perSubskillAcc).map((id) => {
    const acc = perSubskillAcc[id]
    const masteryAfter = masteryOf(after, id, now).mastery
    const masteryBeforeVal = before[id] ?? 0
    return {
      subskillId: id,
      attempts: acc.attempts,
      correct: acc.correct,
      accuracy: acc.attempts ? acc.correct / acc.attempts : 0,
      masteryBefore: masteryBeforeVal,
      masteryAfter,
      delta: masteryAfter - masteryBeforeVal,
    }
  }).sort((a, b) => a.subskillId.localeCompare(b.subskillId))

  const totalAnswered = records.length
  const totalCorrect = records.filter((r) => r.correct).length

  // Encouraging, non-punitive recommendations for the weakest areas practiced.
  const recommendations = perSubskill
    .filter((s) => s.accuracy < 0.6 || s.masteryAfter < 0.5)
    .sort((a, b) => a.masteryAfter - b.masteryAfter)
    .slice(0, 3)
    .map((s) => {
      const name = getSubskill(s.subskillId)?.name ?? s.subskillId
      return `Keep practicing "${name}" — you're improving; a little more review will lock it in.`
    })

  const dueSoonSubskills = Object.values(after)
    .filter((m) => isDue(m.nextReview, now + DAY))
    .map((m) => m.subskillId)
    .sort()

  return {
    summary: {
      totalAnswered,
      totalCorrect,
      accuracy: totalAnswered ? totalCorrect / totalAnswered : 0,
      perSubskill,
      misconceptions,
      recommendations,
      dueSoonSubskills,
    },
    masteryAfter: after,
  }
}
