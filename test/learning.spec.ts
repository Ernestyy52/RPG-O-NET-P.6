import { describe, it, expect } from 'vitest'
import { CURRICULUM_QUESTIONS, authorQuestion } from '~/data/curriculum/adapter'
import { SUBSKILLS } from '~/data/curriculum/taxonomy'
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import {
  newMastery, applyAnswer, weaknessOf, MASTERY_ALPHA, type SubskillMastery,
} from '~/data/learning/mastery'
import { nextStability, isDue, DEFAULT_SCHEDULE } from '~/data/learning/scheduler'
import { selectQuestion, selectQuestions, questionWeight } from '~/data/learning/selector'
import { generateDailyPlan } from '~/data/learning/planner'
import { summarizeSession, type AnswerRecord } from '~/data/learning/summary'
import { mulberry32 } from '~/data/learning/rng'
import { analyzeAnswerPositions } from '~/data/curriculum/validation'
import { runMigrations } from '~/utils/save/migrations'
import { CURRENT_SAVE_VERSION, type SaveEnvelope } from '~/utils/save/schema'

const NOW = 1_000_000_000_000
const DAY = 24 * 60 * 60 * 1000
const POOL = CURRICULUM_QUESTIONS
const WEAK = 'vocab.everyday-nouns'    // vocabulary questions map here
const STRONG = 'grammar.present-simple' // grammar questions map here

function strongExcept(weakId: string, now = NOW): Record<string, SubskillMastery> {
  const map: Record<string, SubskillMastery> = {}
  for (const s of SUBSKILLS) {
    map[s.id] = { ...newMastery(s.id, now), mastery: 0.95, attempts: 10, correct: 10, stability: 10 * DAY, lastSeen: now, nextReview: now + 10 * DAY }
  }
  map[weakId] = { ...newMastery(weakId, now), mastery: 0.05, attempts: 4, correct: 0, stability: 0, lastSeen: now, nextReview: now - 1 }
  return map
}

describe('mastery — updates & response time (learning only, no combat coupling)', () => {
  it('a correct answer raises mastery by the EMA and grows the review interval', () => {
    const m0 = newMastery(WEAK, NOW)
    const m1 = applyAnswer(m0, { correct: true, responseMs: 2000, now: NOW })
    expect(m1.mastery).toBeCloseTo(MASTERY_ALPHA * 1, 5) // 0 + 0.3*(1-0)
    expect(m1.attempts).toBe(1)
    expect(m1.correct).toBe(1)
    expect(m1.avgResponseMs).toBe(2000)
    expect(m1.stability).toBeGreaterThan(0)
    expect(m1.nextReview).toBeGreaterThan(NOW)
  })

  it('a wrong answer lowers mastery and resets the interval to the minimum', () => {
    let m = newMastery(WEAK, NOW)
    for (let i = 0; i < 5; i++) m = applyAnswer(m, { correct: true, now: NOW })
    const beforeWrong = m.mastery
    const after = applyAnswer(m, { correct: false, misconception: 'confusing similar places', now: NOW })
    expect(after.mastery).toBeLessThan(beforeWrong)
    expect(after.stability).toBe(DEFAULT_SCHEDULE.minIntervalMs)
    expect(after.misconceptions['confusing similar places']).toBe(1)
    expect(after.lapses).toBe(1) // wrong after being well-known
  })

  it('running response-time average is correct', () => {
    let m = newMastery(WEAK, NOW)
    m = applyAnswer(m, { correct: true, responseMs: 1000, now: NOW })
    m = applyAnswer(m, { correct: true, responseMs: 3000, now: NOW })
    expect(m.avgResponseMs).toBe(2000)
  })

  it('mastery objects carry ONLY learning fields (firewall vs combat power, ADR 0003)', () => {
    let m = newMastery(WEAK, NOW)
    m = applyAnswer(m, { correct: true, now: NOW })
    const combatKeys = ['atk', 'def', 'hp', 'mp', 'mag', 'speed', 'gold']
    for (const k of combatKeys) expect(k in m).toBe(false)
    expect(Object.keys(m).sort()).toEqual(
      ['attempts', 'avgResponseMs', 'correct', 'lapses', 'lastSeen', 'mastery', 'misconceptions', 'nextReview', 'stability', 'subskillId'],
    )
  })

  it('is deterministic — same inputs give identical output', () => {
    const a = applyAnswer(newMastery(WEAK, NOW), { correct: true, responseMs: 1500, now: NOW })
    const b = applyAnswer(newMastery(WEAK, NOW), { correct: true, responseMs: 1500, now: NOW })
    expect(a).toEqual(b)
  })
})

describe('scheduler — SM-2-lite spacing', () => {
  it('higher mastery earns a longer interval on a correct answer', () => {
    const low = nextStability(DEFAULT_SCHEDULE.minIntervalMs, true, 0.1)
    const high = nextStability(DEFAULT_SCHEDULE.minIntervalMs, true, 0.9)
    expect(high).toBeGreaterThan(low)
    expect(low).toBeGreaterThanOrEqual(DEFAULT_SCHEDULE.minIntervalMs)
  })

  it('unseen subskills are immediately due', () => {
    const m = newMastery(WEAK, NOW)
    expect(isDue(m.nextReview, NOW)).toBe(true)
  })
})

describe('selector — weak & due skills recur more often', () => {
  it('draws weak/due subskills more than mastered ones', () => {
    const state = strongExcept(WEAK)
    const rng = mulberry32(12345)
    const counts: Record<string, number> = {}
    for (let i = 0; i < 600; i++) {
      const q = selectQuestion(POOL, state, { now: NOW, mode: 'learning-focus', rng })!
      counts[q.subskillId] = (counts[q.subskillId] ?? 0) + 1
    }
    expect((counts[WEAK] ?? 0)).toBeGreaterThan(counts[STRONG] ?? 0)
  })

  it('only serves reviewed+valid content — never a draft', () => {
    const draft = authorQuestion({ id: 'draft-x', category: 'vocabulary', cefr: 'A1', difficulty: 1, prompt: 'draft?', choices: ['a', 'b', 'c', 'd'], answerIndex: 0 })
    const pool: CurriculumQuestion[] = [...POOL, draft]
    const rng = mulberry32(7)
    for (let i = 0; i < 300; i++) {
      const q = selectQuestion(pool, {}, { now: NOW, mode: 'adventure', rng })!
      expect(q.id).not.toBe('draft-x')
    }
  })

  it('anti-repeat: no question repeats within the avoid window', () => {
    const picks = selectQuestions(POOL, {}, 25, { now: NOW, mode: 'adventure', rng: mulberry32(99), avoidRecent: 5 })
    for (let i = 0; i < picks.length; i++) {
      const window = picks.slice(Math.max(0, i - 5), i).map((q) => q.id)
      expect(window).not.toContain(picks[i].id)
    }
  })

  it('learning-focus targets the weak subskill more than adventure mode', () => {
    const state = strongExcept(WEAK)
    const fractionWeak = (mode: 'adventure' | 'learning-focus') => {
      const rng = mulberry32(2024)
      let weak = 0
      const N = 800
      for (let i = 0; i < N; i++) {
        const q = selectQuestion(POOL, state, { now: NOW, mode, rng })!
        if (q.subskillId === WEAK) weak++
      }
      return weak / N
    }
    expect(fractionWeak('learning-focus')).toBeGreaterThan(fractionWeak('adventure'))
  })

  it('selection preserves answer-position balance (no positional bias introduced)', () => {
    const picks = selectQuestions(POOL, {}, 200, { now: NOW, mode: 'adventure', rng: mulberry32(1), avoidRecent: 0 })
    expect(analyzeAnswerPositions(picks).balanced).toBe(true)
  })
})

describe('planner — 10/20/30 minute sessions & modes', () => {
  it('scales target questions with session length', () => {
    const base = { date: '2026-07-12', mode: 'learning-focus' as const, masteryBySubskill: {} }
    expect(generateDailyPlan(POOL, { ...base, minutes: 10 }).targetQuestionCount).toBe(12)
    expect(generateDailyPlan(POOL, { ...base, minutes: 20 }).targetQuestionCount).toBe(24)
    expect(generateDailyPlan(POOL, { ...base, minutes: 30 }).targetQuestionCount).toBe(36)
  })

  it('produces the requested number of unique-ish questions, all selectable', () => {
    const plan = generateDailyPlan(POOL, { date: '2026-07-12', minutes: 20, mode: 'adventure', masteryBySubskill: {} })
    expect(plan.questionIds.length).toBe(24)
    const validIds = new Set(POOL.map((q) => q.id))
    for (const id of plan.questionIds) expect(validIds.has(id)).toBe(true)
    expect(plan.subskillFocus.length).toBeGreaterThan(0)
  })

  it('is deterministic for the same date+mode and varies across dates', () => {
    const a1 = generateDailyPlan(POOL, { date: '2026-07-12', minutes: 20, mode: 'adventure', masteryBySubskill: {} })
    const a2 = generateDailyPlan(POOL, { date: '2026-07-12', minutes: 20, mode: 'adventure', masteryBySubskill: {} })
    const b = generateDailyPlan(POOL, { date: '2026-07-13', minutes: 20, mode: 'adventure', masteryBySubskill: {} })
    expect(a1.questionIds).toEqual(a2.questionIds)
    expect(a1.questionIds).not.toEqual(b.questionIds)
  })
})

describe('planner — non-punitive missed days & rested bonus', () => {
  it('a gap of several days grants a POSITIVE rested bonus and never shrinks the plan', () => {
    const base = generateDailyPlan(POOL, { date: '2026-07-12', minutes: 20, mode: 'learning-focus', masteryBySubskill: {} })
    const afterGap = generateDailyPlan(POOL, {
      date: '2026-07-12', minutes: 20, mode: 'learning-focus', masteryBySubskill: {}, lastSessionDate: '2026-07-07',
    })
    expect(afterGap.restedBonus).toBeGreaterThan(0)
    expect(afterGap.targetQuestionCount).toBeGreaterThanOrEqual(base.targetQuestionCount) // more, never less
  })

  it('consecutive days and first-ever session give no bonus (and no penalty)', () => {
    const firstEver = generateDailyPlan(POOL, { date: '2026-07-12', minutes: 20, mode: 'adventure', masteryBySubskill: {} })
    const nextDay = generateDailyPlan(POOL, { date: '2026-07-12', minutes: 20, mode: 'adventure', masteryBySubskill: {}, lastSessionDate: '2026-07-11' })
    expect(firstEver.restedBonus).toBe(0)
    expect(nextDay.restedBonus).toBe(0)
    expect(nextDay.targetQuestionCount).toBe(24) // unchanged — no missed-day penalty
  })
})

describe('summary — session movement & recommendations', () => {
  it('summarizes accuracy, per-subskill movement, misconceptions, and next reviews', () => {
    const records: AnswerRecord[] = [
      { subskillId: WEAK, correct: true, responseMs: 1800 },
      { subskillId: WEAK, correct: false, misconception: 'confusing similar places', responseMs: 4200 },
      { subskillId: WEAK, correct: true, responseMs: 1500 },
      { subskillId: STRONG, correct: false, responseMs: 5000 },
    ]
    const { summary, masteryAfter } = summarizeSession({}, records, NOW)
    expect(summary.totalAnswered).toBe(4)
    expect(summary.totalCorrect).toBe(2)
    expect(summary.accuracy).toBeCloseTo(0.5, 5)
    expect(masteryAfter[WEAK].attempts).toBe(3)
    expect(summary.misconceptions['confusing similar places']).toBe(1)
    expect(summary.recommendations.length).toBeGreaterThan(0)
    expect(summary.perSubskill.map((s) => s.subskillId).sort()).toEqual([STRONG, WEAK].sort())
    expect(summary.dueSoonSubskills.length).toBeGreaterThan(0)
  })
})

describe('save — learning slice migrates v1 → v2', () => {
  it('adds mastery + lastSessionDate to an old v1 envelope while preserving correctAnswers', () => {
    const v1 = {
      version: 1, savedAt: 0,
      slices: {
        profile: {}, character: {}, learning: { correctAnswers: 42 }, session: {}, inventory: {}, quest: {}, settings: {},
      },
    } as unknown as SaveEnvelope
    const migrated = runMigrations(v1)
    // v1 steps all the way to the current version; the learning fields are added and preserved.
    expect(migrated.version).toBe(CURRENT_SAVE_VERSION)
    expect(migrated.slices.learning.correctAnswers).toBe(42)
    expect(migrated.slices.learning.mastery).toEqual({})
    expect(migrated.slices.learning.lastSessionDate).toBe('')
  })
})
