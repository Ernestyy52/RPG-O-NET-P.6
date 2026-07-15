// ================================================================================================
// Battle question selector (S-grade learning pass) — mastery-weighted, tier-true, deterministic.
// Proves the Phase-06 "weak subskills recur" property now holds on the BATTLE path (not only in
// Knowledge Breaks / expeditions), plus the store hook that feeds battle answers into mastery.
// ================================================================================================
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { selectBattleQuestion, MASTERY_BATTLE_SELECTION_ENABLED } from '~/data/learning/battleSelector'
import { CURRICULUM_QUESTIONS } from '~/data/curriculum/adapter'
import { newMastery, applyAnswer, type SubskillMastery } from '~/data/learning/mastery'
import { mulberry32 } from '~/data/learning/rng'
import { cefrForFloor } from '~/data/questions'
import { useLearningStore } from '~/stores/learning'

const NOW = 1_800_000_000_000

/** mastery entry with n answers, all correct/wrong, ending "not due" or naturally scheduled. */
function trained(subskillId: string, n: number, correct: boolean): SubskillMastery {
  let m = newMastery(subskillId, NOW - 1000)
  for (let i = 0; i < n; i++) m = applyAnswer(m, { correct, now: NOW - 1000 + i })
  return m
}

describe('battle selector — tier & determinism', () => {
  it('flag is on (weak-recur battles live)', () => {
    expect(MASTERY_BATTLE_SELECTION_ENABLED).toBe(true)
  })

  it('serves only questions from the floor CEFR tier', () => {
    for (const floor of [1, 20, 50, 80]) {
      const tier = cefrForFloor(floor)
      const rng = mulberry32(7)
      for (let i = 0; i < 20; i++) {
        const q = selectBattleQuestion(CURRICULUM_QUESTIONS, { floor, difficulty: 3, mastery: {}, now: NOW, rng })
        expect(q?.cefr).toBe(tier)
      }
    }
  })

  it('is deterministic for the same seed and inputs', () => {
    const pick = () => {
      const rng = mulberry32(42)
      return Array.from({ length: 10 }, () =>
        selectBattleQuestion(CURRICULUM_QUESTIONS, { floor: 5, difficulty: 2, mastery: {}, now: NOW, rng })!.id)
    }
    expect(pick()).toEqual(pick())
  })

  it('avoids recently served ids while the pool allows', () => {
    const rng = mulberry32(3)
    const recent: string[] = []
    for (let i = 0; i < 8; i++) {
      const q = selectBattleQuestion(CURRICULUM_QUESTIONS, { floor: 5, difficulty: 2, mastery: {}, now: NOW, rng, recentIds: recent })!
      expect(recent).not.toContain(q.id)
      recent.push(q.id)
    }
  })

  it('returns null only for an empty pool', () => {
    expect(selectBattleQuestion([], { floor: 1, difficulty: 1, mastery: {}, now: NOW, rng: mulberry32(1) })).toBeNull()
  })
})

describe('battle selector — weak subskills recur', () => {
  it('serves weak-subskill questions more often than mastered ones', () => {
    // On Pre-A1 (floor 5): make every subskill strong EXCEPT one weak target.
    const tierSubs = [...new Set(CURRICULUM_QUESTIONS.filter((q) => q.cefr === 'Pre-A1').map((q) => q.subskillId))]
    expect(tierSubs.length).toBeGreaterThan(3)
    const weak = tierSubs[0]
    const mastery: Record<string, SubskillMastery> = {}
    for (const sub of tierSubs) mastery[sub] = trained(sub, 10, sub !== weak)

    const rng = mulberry32(99)
    let weakHits = 0
    const draws = 400
    for (let i = 0; i < draws; i++) {
      const q = selectBattleQuestion(CURRICULUM_QUESTIONS, { floor: 5, difficulty: 2, mastery, now: NOW, rng })!
      if (q.subskillId === weak) weakHits++
    }
    const weakShare = weakHits / draws
    const poolShare = CURRICULUM_QUESTIONS.filter((q) => q.cefr === 'Pre-A1' && q.subskillId === weak).length
      / CURRICULUM_QUESTIONS.filter((q) => q.cefr === 'Pre-A1').length
    // weak subskill must be served meaningfully above its natural pool share
    expect(weakShare).toBeGreaterThan(poolShare * 1.5)
  })
})

describe('learning store — battle answers feed mastery (never combat)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('records attempts/correct per subskill and schedules review', () => {
    const s = useLearningStore()
    s.recordBattleAnswer('grammar.present-simple', true, 1200, NOW)
    s.recordBattleAnswer('grammar.present-simple', false, 3000, NOW + 1)
    const m = s.mastery['grammar.present-simple']
    expect(m.attempts).toBe(2)
    expect(m.correct).toBe(1)
    expect(m.nextReview).toBeGreaterThan(0)
  })

  it('ignores answers with no subskill tag (no crash, no state)', () => {
    const s = useLearningStore()
    s.recordBattleAnswer(undefined, true)
    expect(Object.keys(s.mastery)).toHaveLength(0)
  })
})
