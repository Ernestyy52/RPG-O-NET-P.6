import { describe, it, expect } from 'vitest'
import {
  WORLD1_MAIN_QUEST, INITIAL_MAIN_QUEST_STATE,
  advanceMainQuest, activeStep, stepProgress, isMainQuestComplete,
  type QuestEvent, type MainQuestState,
} from '~/data/world1/quests'

// ================================================================================================
// Phase 14 Inc 4 — World-1 main quest chain: data integrity (offline-completable, no RNG-gated step)
// and a deterministic progression reducer proven by a full town→boss playthrough.
// ================================================================================================

describe('World-1 main quest — chain integrity', () => {
  it('is a linear chain of 10–15 steps with unique ids and positive rewards', () => {
    expect(WORLD1_MAIN_QUEST.length).toBeGreaterThanOrEqual(10)
    expect(WORLD1_MAIN_QUEST.length).toBeLessThanOrEqual(15)
    const ids = WORLD1_MAIN_QUEST.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of WORLD1_MAIN_QUEST) {
      expect(s.title.trim().length).toBeGreaterThan(0)
      expect(s.summary.trim().length).toBeGreaterThan(0)
      expect(s.giver.trim().length).toBeGreaterThan(0)
      expect(s.reward.exp).toBeGreaterThan(0)
      expect(s.reward.gold).toBeGreaterThan(0)
      expect(s.reward.gems).toBeGreaterThanOrEqual(0)
    }
  })

  it('has NO RNG-gated step — every trigger is a deterministic, offline-earnable kind', () => {
    const deterministic = ['talk-npc', 'reach-floor', 'defeat-monsters', 'answer-correct', 'find-secret', 'enter-dungeon', 'clear-dungeon', 'defeat-boss']
    for (const s of WORLD1_MAIN_QUEST) expect(deterministic).toContain(s.trigger.kind)
  })

  it('spans the full World-1 journey and ends on the Myco Colossus', () => {
    const kinds = WORLD1_MAIN_QUEST.map((s) => s.trigger.kind)
    expect(kinds).toContain('enter-dungeon')
    expect(kinds).toContain('clear-dungeon')
    const last = WORLD1_MAIN_QUEST[WORLD1_MAIN_QUEST.length - 1]
    expect(last.trigger).toEqual({ kind: 'defeat-boss', bossId: 'myco_colossus' })
  })
})

describe('World-1 main quest — reducer', () => {
  it('ignores events that do not touch the active step', () => {
    const { state, completed } = advanceMainQuest(INITIAL_MAIN_QUEST_STATE, { type: 'defeat-monster' })
    expect(state).toEqual(INITIAL_MAIN_QUEST_STATE) // step 0 is a talk-npc; a defeat is unrelated
    expect(completed).toBeUndefined()
  })

  it('accumulates a count trigger and completes only at the target', () => {
    // fast-forward to the "defeat 3 monsters" step (index 2)
    let state: MainQuestState = { step: 2, progress: 0 }
    let res = advanceMainQuest(state, { type: 'defeat-monster' })
    expect(res.completed).toBeUndefined()
    expect(res.state.progress).toBe(1)
    res = advanceMainQuest(res.state, { type: 'defeat-monster' })
    expect(res.state.progress).toBe(2)
    res = advanceMainQuest(res.state, { type: 'defeat-monster' })
    expect(res.completed?.id).toBe('w1_thin_the_swarm') // third defeat completes it
    expect(res.state.step).toBe(3)
    expect(res.state.progress).toBe(0)
  })

  it('a higher floor satisfies a reach-floor threshold', () => {
    const state: MainQuestState = { step: 1, progress: 0 } // reach floor 2
    const res = advanceMainQuest(state, { type: 'reach-floor', floor: 5 })
    expect(res.completed?.id).toBe('w1_into_the_forest')
    expect(res.state.step).toBe(2)
  })

  it('stepProgress reports partial count progress', () => {
    const state: MainQuestState = { step: 3, progress: 2 } // answer 5 correct, 2 so far
    expect(stepProgress(state)).toEqual({ current: 2, target: 5 })
  })
})

describe('World-1 main quest — full playthrough', () => {
  it('completes every step exactly once from town to boss and grants each reward once', () => {
    const journey: QuestEvent[] = [
      { type: 'talk-npc', npcId: 'guildmaster' },
      { type: 'reach-floor', floor: 2 },
      { type: 'defeat-monster' }, { type: 'defeat-monster' }, { type: 'defeat-monster' },
      { type: 'answer-correct' }, { type: 'answer-correct' }, { type: 'answer-correct' }, { type: 'answer-correct' }, { type: 'answer-correct' },
      { type: 'find-secret', secretId: 'w1_field_clearing' },
      { type: 'enter-dungeon', layoutId: 'world01-mini' },
      { type: 'clear-dungeon', layoutId: 'world01-mini' },
      { type: 'talk-npc', npcId: 'portal_guardian' },
      { type: 'reach-floor', floor: 8 },
      { type: 'enter-dungeon', layoutId: 'world01-main' },
      { type: 'clear-dungeon', layoutId: 'world01-main' },
      { type: 'defeat-boss', bossId: 'myco_colossus' },
    ]

    let state = INITIAL_MAIN_QUEST_STATE
    const completedIds: string[] = []
    let grantedGold = 0
    for (const ev of journey) {
      const res = advanceMainQuest(state, ev)
      state = res.state
      if (res.completed) { completedIds.push(res.completed.id); grantedGold += res.completed.reward.gold }
    }

    expect(isMainQuestComplete(state)).toBe(true)
    expect(activeStep(state)).toBeUndefined()
    expect(completedIds).toEqual(WORLD1_MAIN_QUEST.map((s) => s.id)) // each step completed once, in order
    expect(grantedGold).toBe(WORLD1_MAIN_QUEST.reduce((g, s) => g + s.reward.gold, 0))

    // replaying the final boss event after completion is a safe no-op (no double reward)
    const replay = advanceMainQuest(state, { type: 'defeat-boss', bossId: 'myco_colossus' })
    expect(replay.completed).toBeUndefined()
    expect(replay.state).toEqual(state)
  })
})
