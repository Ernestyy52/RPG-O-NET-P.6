import { describe, it, expect, beforeEach } from 'vitest'
import { KnowledgeBreakController, DEFAULT_KNOWLEDGE_BREAK_CONFIG } from '~/data/learning/knowledgeBreak'
import { mulberry32 } from '~/data/learning/rng'
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import type { SubskillMastery } from '~/data/learning/mastery'

// ================================================================================================
// Phase 10 — Knowledge Break: not every hit, wrong ≠ instant death, learning updates, idempotent
// (no duplicate/lock across scene changes), no-question fallback.
// ================================================================================================

function q(id: string, subskillId: string, answerIndex = 0, misconceptions?: string[]): CurriculumQuestion {
  return {
    id, prompt: `Question ${id}`, choices: ['alpha', 'bravo', 'charlie', 'delta'], answerIndex,
    category: 'vocabulary', cefr: 'Pre-A1', difficulty: 1,
    status: 'reviewed', provenance: { source: 'authored' }, subskillId,
    explanation: 'because it is correct', misconceptions,
  }
}

const POOL: CurriculumQuestion[] = [
  q('k1', 'vocab.everyday-nouns', 0, ['noun-confusion']),
  q('k2', 'grammar.present-simple', 1, ['tense-slip']),
  q('k3', 'reading.main-idea', 2),
]

const EMPTY_MASTERY: Record<string, SubskillMastery> = {}
const rng = () => 0.5 // deterministic enough for selection in tests

function freshController() {
  return new KnowledgeBreakController(DEFAULT_KNOWLEDGE_BREAK_CONFIG) // attacksPerBreak 3, gap 4000ms
}

describe('KnowledgeBreak — cadence (not every hit)', () => {
  it('does not open before attacksPerBreak hero attacks', () => {
    const kb = freshController()
    kb.registerHeroAttack()
    kb.registerHeroAttack()
    expect(kb.breakReady(10_000)).toBe(false)
    expect(kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })).toBeNull()
  })

  it('opens on the 3rd attack and resets the counter afterward', () => {
    const kb = freshController()
    kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
    expect(kb.breakReady(10_000)).toBe(true)
    const open = kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })
    expect(open).not.toBeNull()
    expect(kb.isOpen).toBe(true)
    // resolve, then the counter must climb again before another break
    kb.resolve(open!.question.answerIndex, { now: 10_100 })
    expect(kb.breakReady(20_000)).toBe(false)
  })

  it('honors the minimum gap between breaks', () => {
    const kb = freshController()
    kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
    const open = kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })!
    kb.resolve(0, { now: 10_000 }) // break ends at t=10000
    kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
    expect(kb.breakReady(11_000)).toBe(false) // only 1s later < 4000ms gap
    expect(kb.breakReady(14_000)).toBe(true) // 4s later
    expect(open.question).toBeDefined()
  })
})

describe('KnowledgeBreak — no-question fallback', () => {
  it('returns null (combat continues) when no reviewed question is selectable', () => {
    const kb = freshController()
    kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
    // all draft ⇒ selectableInProduction filters everything out
    const draftPool = POOL.map((p) => ({ ...p, status: 'draft' as const }))
    expect(kb.open({ now: 10_000, pool: draftPool, mastery: EMPTY_MASTERY, rng })).toBeNull()
    expect(kb.isOpen).toBe(false)
    expect(kb.open({ now: 10_000, pool: [], mastery: EMPTY_MASTERY, rng })).toBeNull()
  })
})

describe('KnowledgeBreak — idempotent (no duplicate / lock on scene change)', () => {
  let kb: KnowledgeBreakController
  beforeEach(() => {
    kb = freshController()
    kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
  })

  it('a second open() while one is mid-flight returns the same break, not a new one', () => {
    const a = kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })
    const b = kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })
    expect(a).toBe(b)
    expect(kb.answeredCount).toBe(0)
  })

  it('a second resolve() returns null and records the answer only once', () => {
    const open = kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })!
    const first = kb.resolve(open.question.answerIndex, { now: 10_050 })
    expect(first).not.toBeNull()
    expect(kb.resolve(open.question.answerIndex, { now: 10_060 })).toBeNull()
    expect(kb.answeredCount).toBe(1)
  })

  it('cancel() clears an open break without recording (safe scene teardown)', () => {
    kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })
    expect(kb.isOpen).toBe(true)
    kb.cancel(10_000)
    expect(kb.isOpen).toBe(false)
    expect(kb.answeredCount).toBe(0)
    expect(kb.resolve(0, { now: 10_100 })).toBeNull() // nothing to resolve
  })
})

describe('KnowledgeBreak — answer effects (wrong ≠ death) + learning', () => {
  function openBreak(kb: KnowledgeBreakController) {
    kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
    return kb.open({ now: 10_000, pool: POOL, mastery: EMPTY_MASTERY, rng })!
  }

  it('correct answer empowers; wrong answer only loses the combo (never HP)', () => {
    const kb = freshController()
    const open = openBreak(kb)
    const correct = kb.resolve(open.question.answerIndex, { now: 10_050 })!
    expect(correct.correct).toBe(true)
    expect(correct.effect).toBe('empower')

    const kb2 = freshController()
    const open2 = openBreak(kb2)
    const wrongIndex = (open2.question.answerIndex + 1) % open2.question.choices.length
    const wrong = kb2.resolve(wrongIndex, { now: 10_050 })!
    expect(wrong.correct).toBe(false)
    expect(wrong.effect).toBe('combo-lost')
    // structural guarantee: a resolution carries no HP/damage field — a wrong answer cannot be lethal
    expect(Object.keys(wrong)).toEqual(['correct', 'question', 'record', 'effect'])
  })

  it('records the probed misconception on a wrong answer', () => {
    const kb = freshController()
    kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
    // force a specific question by giving a single-item pool
    const single = [q('kx', 'vocab.everyday-nouns', 0, ['noun-confusion'])]
    const open = kb.open({ now: 10_000, pool: single, mastery: EMPTY_MASTERY, rng })!
    const res = kb.resolve(1, { now: 10_050 })!
    expect(res.record.misconception).toBe('noun-confusion')
    expect(res.record.subskillId).toBe('vocab.everyday-nouns')
  })

  it('folds answers into a learning summary with updated mastery', () => {
    const kb = freshController()
    // answer two breaks correctly
    for (const t of [10_000, 20_000]) {
      kb.registerHeroAttack(); kb.registerHeroAttack(); kb.registerHeroAttack()
      const open = kb.open({ now: t, pool: POOL, mastery: EMPTY_MASTERY, rng })!
      kb.resolve(open.question.answerIndex, { now: t + 50 })
    }
    expect(kb.answeredCount).toBe(2)
    const { summary, masteryAfter } = kb.summarize(EMPTY_MASTERY, 30_000)
    expect(summary.totalAnswered).toBe(2)
    expect(summary.totalCorrect).toBe(2)
    // at least one practiced subskill now has mastery above the zero baseline
    const anyImproved = Object.values(masteryAfter).some((m) => m.mastery > 0)
    expect(anyImproved).toBe(true)
  })
})
