import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLearningStore } from '~/stores/learning'
import { newMastery, applyAnswer, type SubskillMastery } from '~/data/learning/mastery'
import type { SessionSummary } from '~/data/learning/summary'

// ================================================================================================
// Phase 14 flip #7 — adaptive expeditions served through the learning store: a non-fallback expedition
// is generated from real reviewed content, progress is a DAILY mastery delta, and completed objectives
// claim exactly once. (The expedition domain itself is covered in expedition.spec.ts.)
// ================================================================================================

beforeEach(() => setActivePinia(createPinia()))

const DUMMY_SUMMARY = {} as SessionSummary

/** Build a mastery entry with `n` correct answers, via the real domain (valid SubskillMastery shape). */
function correctMastery(subskillId: string, n: number): SubskillMastery {
  let m = newMastery(subskillId, 0)
  for (let i = 0; i < n; i++) m = applyAnswer(m, { correct: true, now: i + 1 })
  return m
}

describe('learning store — adaptive expedition (flip #7)', () => {
  it('generates a non-fallback expedition with content-tied objectives', () => {
    const s = useLearningStore()
    s.ensureExpedition('2026-07-14')
    expect(s.expedition).toBeTruthy()
    expect(s.expedition!.fallback).toBe(false) // real reviewed content ⇒ not the legacy fallback
    expect(s.expedition!.objectives.length).toBeGreaterThan(0)
  })

  it('is idempotent for the same day (does not regenerate)', () => {
    const s = useLearningStore()
    s.ensureExpedition('2026-07-14')
    const first = s.expedition
    s.ensureExpedition('2026-07-14')
    expect(s.expedition).toBe(first) // same object, baseline preserved
  })

  it('completes a drill objective from the daily mastery delta and claims it exactly once', () => {
    const s = useLearningStore()
    s.ensureExpedition('2026-07-14') // baseline snapshot: empty mastery
    const drill = s.expedition!.objectives.find((o) => o.kind === 'weak-skill-drill' && !o.bonus && o.subskillId)
    expect(drill).toBeTruthy()

    // answer the drilled subskill enough times to clear the target (delta vs the empty baseline)
    s.applySessionResult({ [drill!.subskillId!]: correctMastery(drill!.subskillId!, drill!.target) }, DUMMY_SUMMARY)

    const result = s.expeditionResult!
    expect(result.objectives.find((o) => o.id === drill!.id)!.complete).toBe(true)

    const reward = s.claimExpeditionObjective(drill!.id)
    expect(reward).not.toBeNull()
    expect(reward!.gold).toBeGreaterThan(0)
    expect(s.claimedObjectives).toContain(drill!.id)
    expect(s.claimExpeditionObjective(drill!.id)).toBeNull() // idempotent — no double reward
  })

  it('will not claim an objective that is not yet complete', () => {
    const s = useLearningStore()
    s.ensureExpedition('2026-07-14')
    const drill = s.expedition!.objectives.find((o) => o.kind === 'weak-skill-drill' && o.subskillId)!
    expect(s.claimExpeditionObjective(drill.id)).toBeNull() // no progress recorded
    expect(s.claimedObjectives).not.toContain(drill.id)
  })
})
