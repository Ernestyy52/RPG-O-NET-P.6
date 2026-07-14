import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore, ensurePlayerDefaults } from '~/stores/player'

// ================================================================================================
// Phase 17 — stability: repeated save/hydrate cycles and heavy mutation stay BOUNDED and lossless
// (no unbounded growth, no corruption). The interactive viewport/FPS matrix is a human measurement.
// ================================================================================================

beforeEach(() => setActivePinia(createPinia()))

function freshWarrior() {
  const p = usePlayerStore()
  p.createCharacter({ name: 'T', gender: 'male', classId: 'warrior', face: 'calm', hair: 'short', color: 'amber' })
  return p
}

describe('stability — bounded state', () => {
  it('the adventure log stays capped no matter how many events fire', () => {
    const p = freshWarrior()
    for (let i = 0; i < 500; i++) p.addLog(`event ${i}`)
    expect(p.adventureLog.length).toBeLessThanOrEqual(60)
    expect(p.adventureLog.at(-1)).toBe('event 499') // newest kept
  })

  it('heavy quest-event spam never overflows the chain or side-quest targets', () => {
    const p = freshWarrior()
    p.dispatchQuestEvent({ type: 'talk-npc', npcId: 'guildmaster' })
    for (let i = 0; i < 1000; i++) {
      p.dispatchQuestEvent({ type: 'defeat-monster' })
      p.dispatchQuestEvent({ type: 'answer-correct' })
    }
    // main quest step is clamped to the chain, side-quest progress to each target
    expect(p.mainQuest.step).toBeLessThanOrEqual(20)
    for (const s of p.sideQuests) expect(s.progress).toBeLessThanOrEqual(s.target)
  })
})

describe('stability — repeated save/hydrate cycles are lossless + idempotent', () => {
  it('survives 100 serialize→hydrate→default cycles with no corruption or growth', () => {
    const p = freshWarrior()
    p.dispatchQuestEvent({ type: 'talk-npc', npcId: 'guildmaster' }) // advances main quest (grants a reward)
    p.socketedSigils = { weapon: ['sigil_might_t1'] }
    p.level = 9    // set AFTER the quest grant so the fixture values are exact
    p.gold = 777

    let snapshot = JSON.parse(JSON.stringify(p.$state))
    for (let i = 0; i < 100; i++) {
      // simulate a reload: fresh pinia + store hydrated from the snapshot, then defaulted
      setActivePinia(createPinia())
      const reloaded = usePlayerStore()
      reloaded.$patch(snapshot)
      ensurePlayerDefaults(reloaded)
      // integrity holds every cycle
      expect(reloaded.level).toBe(9)
      expect(reloaded.gold).toBe(777)
      expect(reloaded.mainQuest.step).toBe(1)
      expect(reloaded.socketedSigils.weapon).toEqual(['sigil_might_t1'])
      expect(typeof reloaded.stats.atk).toBe('number') // getters safe
      snapshot = JSON.parse(JSON.stringify(reloaded.$state))
    }
    // the serialized size doesn't grow across cycles (no accumulation)
    const finalSize = JSON.stringify(snapshot).length
    expect(finalSize).toBeLessThan(4000)
  })
})
