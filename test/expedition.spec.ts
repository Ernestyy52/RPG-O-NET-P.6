import { describe, it, expect } from 'vitest'
import { generateExpedition, evaluateExpedition, type ExpeditionInput } from '~/data/learning/expedition'
import { newMastery, type SubskillMastery } from '~/data/learning/mastery'
import type { CurriculumQuestion } from '~/data/curriculum/schema'
import type { OnetDomain } from '~/data/curriculum/taxonomy'

// ================================================================================================
// Phase 11 — Adaptive Daily Expeditions: plans vary meaningfully, missed days don't punish,
// objectives completable & deterministic, no numeric-only filler, fallback.
// ================================================================================================

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_752_000_000_000

function q(id: string, subskillId: string, answerIndex = 0): CurriculumQuestion {
  return {
    id, prompt: `Question ${id}`, choices: ['alpha', 'bravo', 'charlie', 'delta'], answerIndex,
    category: 'vocabulary', cefr: 'Pre-A1', difficulty: 1,
    status: 'reviewed', provenance: { source: 'authored' }, subskillId, explanation: 'x',
  }
}

const POOL: CurriculumQuestion[] = [
  q('v1', 'vocab.everyday-nouns', 0), q('v2', 'vocab.verbs-actions', 1), q('v3', 'vocab.adjectives', 2),
  q('g1', 'grammar.present-simple', 3), q('g2', 'grammar.articles-prepositions', 0), q('g3', 'grammar.tense-past', 1),
  q('r1', 'reading.main-idea', 2), q('r2', 'reading.detail', 3),
  q('c1', 'convo.greetings-politeness', 0), q('c2', 'convo.directions', 1),
]

const ALL_SUBSKILLS = [
  'vocab.everyday-nouns', 'vocab.verbs-actions', 'vocab.adjectives',
  'grammar.present-simple', 'grammar.articles-prepositions', 'grammar.questions-negatives', 'grammar.tense-past',
  'reading.main-idea', 'reading.detail', 'reading.inference',
  'convo.greetings-politeness', 'convo.requests-responses', 'convo.directions',
]

function strong(subskillId: string): SubskillMastery {
  return { ...newMastery(subskillId, NOW), attempts: 10, correct: 10, mastery: 0.95, nextReview: NOW + 7 * DAY }
}

/** Strengthen every subskill EXCEPT those under `weakPrefix`, so that domain is the clear weak spot. */
function allStrongExcept(weakPrefix: string): Record<string, SubskillMastery> {
  const map: Record<string, SubskillMastery> = {}
  for (const id of ALL_SUBSKILLS) if (!id.startsWith(weakPrefix)) map[id] = strong(id)
  return map
}

function baseInput(over: Partial<ExpeditionInput> = {}): ExpeditionInput {
  return { date: '2026-07-12', minutes: 20, mode: 'adventure', masteryBySubskill: {}, now: NOW, ...over }
}

describe('Expedition — determinism', () => {
  it('produces an identical expedition for the same input', () => {
    const a = generateExpedition(POOL, baseInput())
    const b = generateExpedition(POOL, baseInput())
    expect(a).toEqual(b)
  })
})

describe('Expedition — varies meaningfully with mastery', () => {
  it('targets different weak subskills as mastery changes', () => {
    // grammarWeak: everything mastered except grammar ⇒ drills should be grammar.*
    const grammarWeak = generateExpedition(POOL, baseInput({ masteryBySubskill: allStrongExcept('grammar.') }))
    // vocabWeak: everything mastered except vocab ⇒ drills should be vocab.*
    const vocabWeak = generateExpedition(POOL, baseInput({ masteryBySubskill: allStrongExcept('vocab.') }))

    const drills = (e: ReturnType<typeof generateExpedition>) => e.objectives.filter((o) => o.kind === 'weak-skill-drill').map((o) => o.subskillId).sort()
    expect(drills(grammarWeak)).not.toEqual(drills(vocabWeak))
    expect(drills(grammarWeak).every((id) => id?.startsWith('grammar.'))).toBe(true)
    expect(drills(vocabWeak).every((id) => id?.startsWith('vocab.'))).toBe(true)
    // the plan focus itself adapts, too
    expect(grammarWeak.subskillFocus).not.toEqual(vocabWeak.subskillFocus)
  })
})

describe('Expedition — missed days are non-punitive', () => {
  it('an absence adds bonus objectives and never removes or penalizes', () => {
    const noGap = generateExpedition(POOL, baseInput())
    const gap = generateExpedition(POOL, baseInput({ lastSessionDate: '2026-07-05' })) // 7-day gap

    expect(noGap.restedBonus).toBe(0)
    expect(noGap.objectives.every((o) => !o.bonus)).toBe(true)

    expect(gap.restedBonus).toBeGreaterThan(0)
    expect(gap.objectives.length).toBeGreaterThan(noGap.objectives.length) // additive
    expect(gap.objectives.some((o) => o.bonus)).toBe(true)
    // every reward is positive — no negative/penalty objective anywhere
    for (const o of gap.objectives) {
      expect(o.reward.exp).toBeGreaterThan(0)
      expect(o.reward.gold).toBeGreaterThan(0)
      expect(o.reward.gems).toBeGreaterThanOrEqual(0)
    }
    // the base objectives are unchanged; the gap version is a superset
    const baseIds = noGap.objectives.map((o) => o.id)
    expect(baseIds.every((id) => gap.objectives.some((o) => o.id === id))).toBe(true)
  })
})

describe('Expedition — no numeric-only filler', () => {
  it('every objective is content-tied with a distinct, meaningful kind', () => {
    const exp = generateExpedition(POOL, baseInput())
    const kinds = new Set(exp.objectives.map((o) => o.kind))
    expect(kinds.size).toBeGreaterThanOrEqual(3)
    expect(kinds.has('accuracy')).toBe(true) // a quality gate, not a count
    expect(kinds.has('capstone')).toBe(true) // a narrative finish
    for (const o of exp.objectives) {
      expect(o.description.trim().length).toBeGreaterThan(10)
    }
    // weak-skill drills reference a subskill that actually exists in the pool (completable)
    const poolSubskills = new Set(POOL.map((p) => p.subskillId))
    for (const o of exp.objectives.filter((o) => o.kind === 'weak-skill-drill')) {
      expect(poolSubskills.has(o.subskillId!)).toBe(true)
    }
  })
})

describe('Expedition — objectives completable & deterministic', () => {
  it('evaluates all objectives complete when progress meets every target', () => {
    const exp = generateExpedition(POOL, baseInput())
    const correctBySubskill: Record<string, number> = {}
    for (const o of exp.objectives) if (o.kind === 'weak-skill-drill') correctBySubskill[o.subskillId!] = o.target
    const variety = exp.objectives.find((o) => o.kind === 'domain-variety')
    const due = exp.objectives.find((o) => o.kind === 'review-due')

    const result = evaluateExpedition(exp, {
      correctBySubskill,
      dueCleared: due?.target ?? 0,
      domainsPracticed: (['vocabulary', 'grammar', 'reading', 'conversation'] as OnetDomain[]).slice(0, variety?.target ?? 0),
      accuracy: 1,
      capstoneCleared: true,
    })
    expect(result.allComplete).toBe(true)
    expect(result.completedCount).toBe(exp.objectives.length)
    const expectedReward = exp.objectives.reduce((s, o) => ({ exp: s.exp + o.reward.exp, gold: s.gold + o.reward.gold, gems: s.gems + o.reward.gems }), { exp: 0, gold: 0, gems: 0 })
    expect(result.rewardTotal).toEqual(expectedReward)
  })

  it('leaves an objective incomplete and excludes its reward when its target is not met', () => {
    const exp = generateExpedition(POOL, baseInput())
    const capstone = exp.objectives.find((o) => o.kind === 'capstone')!
    const result = evaluateExpedition(exp, { accuracy: 0.2, capstoneCleared: false }) // fail accuracy + capstone
    expect(result.allComplete).toBe(false)
    expect(result.objectives.find((o) => o.id === capstone.id)!.complete).toBe(false)
    expect(result.rewardTotal.gems).toBe(0) // capstone (the only gem source) not completed
  })
})

describe('Expedition — fallback with no reviewed content', () => {
  it('returns a shallow-counter fallback expedition', () => {
    const draftPool = POOL.map((p) => ({ ...p, status: 'draft' as const }))
    const exp = generateExpedition(draftPool, baseInput())
    expect(exp.fallback).toBe(true)
    expect(exp.planQuestionIds).toEqual([])
    expect(exp.objectives.length).toBe(1)
  })
})
