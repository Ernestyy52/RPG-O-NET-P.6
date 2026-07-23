import { describe, it, expect } from 'vitest'
import {
  buildLearnerReport, buildClassReport, learnerReportToCsv, classRosterToCsv, classReportToJson,
  TEACHER_ENABLED,
} from '~/data/teacher'
import { masteryOf, applyAnswer, type SubskillMastery } from '~/data/learning/mastery'

// ================================================================================================
// Phase 16 — teacher dashboard: aggregate reports + export, with NO answer-key exposure and strict
// learning/game/personal data separation.
// ================================================================================================

function record(map: Record<string, SubskillMastery>, sub: string, correct: boolean, now: number, misconception?: string) {
  map[sub] = applyAnswer(masteryOf(map, sub, now), { correct, now, misconception })
}

/** A learner strong in vocab, weak in grammar (with a recurring misconception). */
function sampleMastery(): Record<string, SubskillMastery> {
  const m: Record<string, SubskillMastery> = {}
  const t = 1_000_000
  for (let i = 0; i < 4; i++) record(m, 'vocab.everyday-nouns', true, t + i)
  record(m, 'vocab.everyday-nouns', false, t + 5, 'confusing similar places (hospital/clinic)')
  record(m, 'grammar.present-simple', true, t + 6)
  for (let i = 0; i < 3; i++) record(m, 'grammar.present-simple', false, t + 7 + i, 'dropping -s on 3rd person singular')
  return m
}

describe('teacher reports — flag', () => {
  it('TEACHER_ENABLED is true (the /teacher dashboard page is wired to this domain)', () => {
    expect(TEACHER_ENABLED).toBe(true)
  })
})

describe('teacher reports — learner aggregation', () => {
  const r = buildLearnerReport('student-01', sampleMastery(), 2_000_000)

  it('aggregates totals + accuracy from mastery', () => {
    expect(r.totalAnswered).toBe(9)
    expect(r.totalCorrect).toBe(5)
    expect(r.accuracy).toBeCloseTo(5 / 9, 2)
    expect(r.byDomain.map((d) => d.domain).sort()).toEqual(['grammar', 'vocabulary'])
  })

  it('surfaces the weakest subskill and the most common misconception', () => {
    expect(r.weakest[0].subskillId).toBe('grammar.present-simple') // lowest mastery
    expect(r.weakest[0].name.length).toBeGreaterThan(0)             // human-readable (understandable flow)
    expect(r.commonMisconceptions[0].tag).toContain('dropping -s')  // count 3 → first
  })

  it('reports coverage as a fraction of the whole curriculum', () => {
    expect(r.coverage).toBeGreaterThan(0)
    expect(r.coverage).toBeLessThanOrEqual(1)
  })
})

describe('teacher reports — class aggregation', () => {
  it('rolls up learner reports into a class overview', () => {
    const a = buildLearnerReport('a', sampleMastery(), 2_000_000)
    const b = buildLearnerReport('b', sampleMastery(), 2_000_000)
    const cls = buildClassReport([a, b])
    expect(cls.learners).toBe(2)
    expect(cls.classAccuracy).toBeCloseTo(5 / 9, 2)
    // grammar.present-simple is weak for BOTH learners
    expect(cls.commonWeakSubskills[0].subskillId).toBe('grammar.present-simple')
    expect(cls.commonWeakSubskills[0].learners).toBe(2)
  })
})

describe('teacher export — CSV/JSON', () => {
  const r = buildLearnerReport('student-01', sampleMastery(), 2_000_000)

  it('learner CSV has a header + a row per domain, parseable', () => {
    const csv = learnerReportToCsv(r)
    const lines = csv.split('\n')
    expect(lines[0]).toBe('label,metric,domain,attempts,correct,accuracy')
    expect(lines.length).toBe(2 + r.byDomain.length) // header + overall + per-domain
  })

  it('class roster CSV + class JSON are well-formed', () => {
    const roster = classRosterToCsv([r])
    expect(roster.split('\n')[0]).toBe('label,answered,correct,accuracy,coverage,dueForReview')
    const json = classReportToJson(buildClassReport([r]))
    expect(() => JSON.parse(json)).not.toThrow()
  })
})

describe('teacher gate — no answer-key exposure + data separation', () => {
  const r = buildLearnerReport('student-01', sampleMastery(), 2_000_000)
  const blob = JSON.stringify(r) + learnerReportToCsv(r) + classReportToJson(buildClassReport([r]))

  it('exposes NO question/answer-key content', () => {
    for (const forbidden of ['answerIndex', 'correctAnswer', 'answer_key', 'choices', 'prompt']) {
      expect(blob).not.toContain(forbidden)
    }
  })

  it('exposes NO game/personal save data (learning ≠ game/personal)', () => {
    for (const forbidden of ['hp', 'gold', 'inventory', 'password', 'accountName', 'sessionId']) {
      expect(blob.toLowerCase()).not.toContain(forbidden.toLowerCase())
    }
    // the only identity is the teacher-supplied label
    expect(r.label).toBe('student-01')
  })
})
