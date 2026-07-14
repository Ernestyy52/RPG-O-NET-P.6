// ================================================================================================
// Teacher reports (Phase 16)
//
// Aggregates LEARNING data (per-subskill mastery, produced by the Phase-06 loop) into teacher-facing
// progress reports. Strict data separation (constitution rule 1 + Phase-16 gate):
//  • Reads ONLY learning-domain data (mastery/subskill taxonomy). It NEVER imports questions/answers
//    (no answer-key exposure) and NEVER imports the player store or save (no game/personal data leak).
//  • The only identity is a teacher-supplied display label — not the game save's personal fields.
// Pure + deterministic so it's unit-testable and carries no side effects.
// ================================================================================================
import type { SubskillMastery } from '~/data/learning/mastery'
import { SUBSKILLS, getSubskill, type OnetDomain } from '~/data/curriculum/taxonomy'

/** Rollback flag (Phase 16). Dormant — no teacher UI is surfaced until wired + reviewed. */
export const TEACHER_ENABLED = false

export interface DomainBreakdown {
  domain: OnetDomain
  attempts: number
  correct: number
  accuracy: number // [0,1]
}

export interface SubskillProgress {
  subskillId: string
  name: string
  domain: OnetDomain
  attempts: number
  correct: number
  mastery: number // [0,1]
}

export interface LearnerReport {
  /** teacher-supplied label (class list id / nickname) — NOT the game save's personal data. */
  label: string
  totalAnswered: number
  totalCorrect: number
  accuracy: number // [0,1]
  /** fraction of the curriculum's subskills the learner has attempted. */
  coverage: number // [0,1]
  byDomain: DomainBreakdown[]
  /** weakest attempted subskills (lowest mastery first) — where to focus teaching. */
  weakest: SubskillProgress[]
  /** most-observed misconception tags across all subskills. */
  commonMisconceptions: { tag: string; count: number }[]
  /** subskills due for review at `now`. */
  dueForReview: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Build a single learner's report from their mastery map. `now` (epoch ms) is used only for the
 * due-for-review count. Pure — no answer content, no game/personal data.
 */
export function buildLearnerReport(label: string, mastery: Record<string, SubskillMastery>, now = Date.now()): LearnerReport {
  const entries = Object.values(mastery).filter((m) => m.attempts > 0)
  const totalAnswered = entries.reduce((s, m) => s + m.attempts, 0)
  const totalCorrect = entries.reduce((s, m) => s + m.correct, 0)

  const byDomainMap = new Map<OnetDomain, { attempts: number; correct: number }>()
  const misconMap = new Map<string, number>()
  for (const m of entries) {
    const domain = getSubskill(m.subskillId)?.domain
    if (domain) {
      const d = byDomainMap.get(domain) ?? { attempts: 0, correct: 0 }
      d.attempts += m.attempts
      d.correct += m.correct
      byDomainMap.set(domain, d)
    }
    for (const [tag, count] of Object.entries(m.misconceptions ?? {})) {
      misconMap.set(tag, (misconMap.get(tag) ?? 0) + count)
    }
  }

  const byDomain: DomainBreakdown[] = [...byDomainMap.entries()]
    .map(([domain, d]) => ({ domain, attempts: d.attempts, correct: d.correct, accuracy: d.attempts ? round2(d.correct / d.attempts) : 0 }))
    .sort((a, b) => a.domain.localeCompare(b.domain))

  const weakest: SubskillProgress[] = entries
    .map((m) => ({ subskillId: m.subskillId, name: getSubskill(m.subskillId)?.name ?? m.subskillId, domain: getSubskill(m.subskillId)?.domain ?? ('vocabulary' as OnetDomain), attempts: m.attempts, correct: m.correct, mastery: round2(m.mastery) }))
    .sort((a, b) => a.mastery - b.mastery || a.subskillId.localeCompare(b.subskillId))
    .slice(0, 5)

  const commonMisconceptions = [...misconMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 5)

  const dueForReview = entries.filter((m) => m.nextReview <= now).length

  return {
    label,
    totalAnswered,
    totalCorrect,
    accuracy: totalAnswered ? round2(totalCorrect / totalAnswered) : 0,
    coverage: round2(entries.length / SUBSKILLS.length),
    byDomain,
    weakest,
    commonMisconceptions,
    dueForReview,
  }
}

export interface ClassReport {
  learners: number
  classAccuracy: number
  /** per-domain class average accuracy. */
  byDomain: DomainBreakdown[]
  /** subskills weak across the most learners (id, name, how many learners have it in their weakest set). */
  commonWeakSubskills: { subskillId: string; name: string; learners: number }[]
  commonMisconceptions: { tag: string; count: number }[]
}

/** Aggregate learner reports into a class overview. Pure. */
export function buildClassReport(reports: LearnerReport[]): ClassReport {
  const totalAnswered = reports.reduce((s, r) => s + r.totalAnswered, 0)
  const totalCorrect = reports.reduce((s, r) => s + r.totalCorrect, 0)

  const byDomainMap = new Map<OnetDomain, { attempts: number; correct: number }>()
  const weakCount = new Map<string, { name: string; learners: number }>()
  const misconMap = new Map<string, number>()
  for (const r of reports) {
    for (const d of r.byDomain) {
      const agg = byDomainMap.get(d.domain) ?? { attempts: 0, correct: 0 }
      agg.attempts += d.attempts
      agg.correct += d.correct
      byDomainMap.set(d.domain, agg)
    }
    for (const w of r.weakest) {
      const e = weakCount.get(w.subskillId) ?? { name: w.name, learners: 0 }
      e.learners += 1
      weakCount.set(w.subskillId, e)
    }
    for (const m of r.commonMisconceptions) misconMap.set(m.tag, (misconMap.get(m.tag) ?? 0) + m.count)
  }

  return {
    learners: reports.length,
    classAccuracy: totalAnswered ? round2(totalCorrect / totalAnswered) : 0,
    byDomain: [...byDomainMap.entries()].map(([domain, d]) => ({ domain, attempts: d.attempts, correct: d.correct, accuracy: d.attempts ? round2(d.correct / d.attempts) : 0 })).sort((a, b) => a.domain.localeCompare(b.domain)),
    commonWeakSubskills: [...weakCount.entries()].map(([subskillId, e]) => ({ subskillId, name: e.name, learners: e.learners })).sort((a, b) => b.learners - a.learners || a.subskillId.localeCompare(b.subskillId)).slice(0, 8),
    commonMisconceptions: [...misconMap.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag)).slice(0, 8),
  }
}
