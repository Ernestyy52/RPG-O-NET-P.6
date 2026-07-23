import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ensurePlayerDefaults, usePlayerStore } from '~/stores/player'

beforeEach(() => setActivePinia(createPinia()))

describe('player MMORPG progression integration', () => {
  it('migrates old saves without resetting existing progress', () => {
    const old = { currentFloor: 8, monsterQuestionHistory: { slime: ['q1'] } }
    ensurePlayerDefaults(old)
    expect(old.currentZoneId).toBe('deepgrove')
    expect(old.jobLevel).toBe(1)
    expect(old.monsterCodex).toEqual({})
    expect(old.monsterQuestionHistory.slime).toEqual(['q1'])
  })

  it('records a victory across codex, job, mastery, and an accepted hunt', () => {
    const player = usePlayerStore()
    player.createCharacter({ name: 'Hunter', gender: 'male', classId: 'archer', face: 'calm', hair: 'short', color: 'amber' })
    player.enterAdventureZone('deepgrove')
    player.ensureHuntingBoard()
    const contract = player.huntingBoard.find((entry) => entry.difficulty === 'standard')!
    player.acceptHunt(contract.id)
    player.recordMonsterVictory({ monsterId: contract.targetMonsterId, expReward: 100 })

    expect(player.monsterCodex[contract.targetMonsterId]?.defeats).toBe(1)
    expect(player.jobExp).toBeGreaterThan(0)
    expect(player.weaponMastery.unarmed?.exp).toBeGreaterThan(0)
    expect(contract.progress).toBe(1)
  })
})
