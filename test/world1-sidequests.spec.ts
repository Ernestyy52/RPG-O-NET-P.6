import { describe, it, expect } from 'vitest'
import {
  WORLD1_SIDE_QUESTS, advanceSideQuest, isSideQuestDone, sideQuestTarget, getSideQuest,
} from '~/data/world1/sideQuests'

// ================================================================================================
// Phase 14 Inc 4 — World-1 side quests: ≥8 varied, offline-completable, deterministic (no RNG step).
// ================================================================================================

describe('World-1 side quests — data', () => {
  it('has at least 8 quests with unique ids, varied kinds, and positive rewards', () => {
    expect(WORLD1_SIDE_QUESTS.length).toBeGreaterThanOrEqual(8)
    const ids = WORLD1_SIDE_QUESTS.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(WORLD1_SIDE_QUESTS.map((q) => q.kind)).size).toBeGreaterThanOrEqual(3) // not all one kind
    for (const q of WORLD1_SIDE_QUESTS) {
      expect(q.npc.length).toBeGreaterThan(0)
      expect(q.summary.length).toBeGreaterThan(0)
      expect(q.reward.exp).toBeGreaterThan(0)
      expect(q.reward.gold).toBeGreaterThan(0)
    }
  })

  it('has no RNG-gated trigger — every kind is deterministic', () => {
    const deterministic = ['talk-npc', 'reach-floor', 'defeat-monsters', 'answer-correct', 'find-secret', 'enter-dungeon', 'clear-dungeon', 'defeat-boss']
    for (const q of WORLD1_SIDE_QUESTS) expect(deterministic).toContain(q.trigger.kind)
  })
})

describe('World-1 side quests — progression', () => {
  it('a hunt quest counts defeats up to its target and completes', () => {
    const q = getSideQuest('sq_slime_cull')! // defeat 5
    expect(sideQuestTarget(q)).toBe(5)
    let p = 0
    for (let i = 0; i < 5; i++) p = advanceSideQuest(q, p, { type: 'defeat-monster' })
    expect(p).toBe(5)
    expect(isSideQuestDone(q, p)).toBe(true)
  })

  it('caps progress at the target and ignores unrelated events', () => {
    const q = getSideQuest('sq_gather_gel')! // defeat 3
    let p = 0
    for (let i = 0; i < 10; i++) p = advanceSideQuest(q, p, { type: 'defeat-monster' })
    expect(p).toBe(3) // capped
    const before = p
    p = advanceSideQuest(q, p, { type: 'answer-correct' }) // unrelated
    expect(p).toBe(before)
  })

  it('a reach-floor quest completes when the floor is reached or exceeded', () => {
    const q = getSideQuest('sq_scout_floor4')! // reach floor 4
    expect(isSideQuestDone(q, advanceSideQuest(q, 0, { type: 'reach-floor', floor: 6 }))).toBe(true)
    expect(isSideQuestDone(q, advanceSideQuest(q, 0, { type: 'reach-floor', floor: 3 }))).toBe(false)
  })

  it('an explore quest completes on entering the right dungeon only', () => {
    const q = getSideQuest('sq_grotto_delve')! // enter world01-mini
    expect(isSideQuestDone(q, advanceSideQuest(q, 0, { type: 'enter-dungeon', layoutId: 'world01-main' }))).toBe(false)
    expect(isSideQuestDone(q, advanceSideQuest(q, 0, { type: 'enter-dungeon', layoutId: 'world01-mini' }))).toBe(true)
  })
})
