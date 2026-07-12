import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '~/stores/player'

function freshWarrior() {
  const player = usePlayerStore()
  player.createCharacter({ name: 'Tester', gender: 'male', classId: 'warrior', face: 'calm', hair: 'short', color: 'amber' })
  return player
}

beforeEach(() => setActivePinia(createPinia()))

describe('player store — character creation & stats', () => {
  it('starts a warrior at level 1 with full HP and starter kit', () => {
    const p = freshWarrior()
    expect(p.level).toBe(1)
    expect(p.characterCreated).toBe(true)
    expect(p.hp).toBe(p.maxHp)
    expect(p.maxHp).toBe(72) // warrior base hp
    expect(p.inventory.potion_s).toBe(2)
  })

  it('composes stats from class base + level growth', () => {
    const p = freshWarrior()
    const atkL1 = p.atk
    p.gainRewards(1000, 0) // level up several times
    expect(p.level).toBeGreaterThan(1)
    expect(p.atk).toBeGreaterThan(atkL1) // growth applied
  })
})

describe('player store — rewards & level up', () => {
  it('levels up, grants a skill point, and refills HP when EXP crosses the threshold', () => {
    const p = freshWarrior()
    expect(p.level).toBe(1)
    p.gainRewards(30, 25) // expToNextLevel(1) === 30
    expect(p.level).toBe(2)
    expect(p.exp).toBe(0)
    expect(p.skillPoints).toBe(1)
    expect(p.gold).toBe(90 + 25)
    expect(p.hp).toBe(p.maxHp) // healed on level up
  })

  it('does not level up below the threshold', () => {
    const p = freshWarrior()
    p.gainRewards(10, 0)
    expect(p.level).toBe(1)
    expect(p.exp).toBe(10)
    expect(p.skillPoints).toBe(0)
  })
})

describe('player store — damage seam (defense mitigation)', () => {
  it('reduces incoming damage by defense but always deals at least 1', () => {
    const p = freshWarrior()
    const def = p.def
    const before = p.hp
    p.takeDamage(10)
    const expected = Math.max(1, Math.round(10 - def * 0.55))
    expect(before - p.hp).toBe(expected)
  })

  it('never drops HP below 0', () => {
    const p = freshWarrior()
    p.takeDamage(99999)
    expect(p.hp).toBe(0)
  })
})

describe('player store — item transactions', () => {
  it('buys a consumable: deducts gold and adds to inventory', () => {
    const p = freshWarrior() // gold 90, currentFloor 1
    const ok = p.buyItem('potion_s') // cost 25
    expect(ok).toBe(true)
    expect(p.gold).toBe(90 - 25)
    expect(p.inventory.potion_s).toBe(3) // 2 starter + 1 bought
  })

  it('refuses to buy when gold is insufficient', () => {
    const p = freshWarrior()
    p.gold = 0
    expect(p.buyItem('potion_s')).toBe(false)
    expect(p.gold).toBe(0)
  })

  it('uses a potion to heal and decrements the stack', () => {
    const p = freshWarrior()
    p.hp = 10
    const ok = p.useConsumable('potion_s')
    expect(ok).toBe(true)
    expect(p.hp).toBeGreaterThan(10)
    expect(p.inventory.potion_s).toBe(1)
  })

  it('does not go negative when consuming more than owned', () => {
    const p = freshWarrior()
    p.consumeItems('potion_s', 999)
    expect(p.inventory.potion_s).toBe(0)
  })
})

describe('player store — daily quest transitions', () => {
  it('rolls 3 quests, progresses, and claims exactly once', () => {
    const p = freshWarrior()
    p.ensureDailyQuests()
    expect(p.dailyQuests.length).toBe(3)

    const answerQuest = p.dailyQuests.find((q) => q.kind === 'answer')!
    p.progressQuest('answer', answerQuest.target)
    expect(answerQuest.progress).toBe(answerQuest.target)

    const goldBefore = p.gold
    expect(p.claimQuest(answerQuest.id)).toBe(true)
    expect(answerQuest.claimed).toBe(true)
    expect(p.gold).toBeGreaterThan(goldBefore)
    // second claim is rejected (idempotent reward)
    expect(p.claimQuest(answerQuest.id)).toBe(false)
  })
})
