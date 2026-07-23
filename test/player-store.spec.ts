import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore, ensurePlayerDefaults } from '~/stores/player'
import { WORLD1_MAIN_QUEST } from '~/data/world1/quests'

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
    expect(p.skillPoints).toBe(3) // ทดลองอัป talent ได้ตั้งแต่เริ่มเกม
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
    expect(p.skillPoints).toBe(4)
    expect(p.gold).toBe(90 + 25)
    expect(p.hp).toBe(p.maxHp) // healed on level up
  })

  it('does not level up below the threshold', () => {
    const p = freshWarrior()
    p.gainRewards(10, 0)
    expect(p.level).toBe(1)
    expect(p.exp).toBe(10)
    expect(p.skillPoints).toBe(3)
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

describe('player store — sigils (flip #6)', () => {
  it('crafts a sigil deterministically: deducts gold + materials, adds the sigil to the bag', () => {
    const p = freshWarrior()
    p.gold = 100
    p.inventory.slime_gel = 5
    expect(p.craftSigil('sigil_might_t1')).toBe(true) // cost: 20g + 1 slime_gel
    expect(p.inventory.sigil_might_t1).toBe(1)
    expect(p.gold).toBe(100 - 20)
    expect(p.inventory.slime_gel).toBe(4)
  })

  it('refuses to craft without the materials (no negative inventory)', () => {
    const p = freshWarrior()
    p.gold = 100
    p.inventory.slime_gel = 0
    expect(p.craftSigil('sigil_might_t1')).toBe(false)
    expect(p.inventory.sigil_might_t1 ?? 0).toBe(0)
    expect(p.gold).toBe(100) // untouched
  })

  it('socketing a Might sigil into equipped gear raises ATK and consumes the bag copy', () => {
    const p = freshWarrior()
    p.equipment.weapon = 'test_weapon'
    p.inventory.sigil_might_t1 = 1
    const atkBefore = p.atk
    expect(p.socketEquipmentSigil('weapon', 'sigil_might_t1')).toBe(true)
    expect(p.socketedSigils.weapon).toEqual(['sigil_might_t1'])
    expect(p.inventory.sigil_might_t1).toBe(0)
    expect(p.atk).toBe(atkBefore + 2) // might t1 = +2 atk
  })

  it('will not socket into an empty slot', () => {
    const p = freshWarrior()
    p.inventory.sigil_might_t1 = 1
    expect(p.socketEquipmentSigil('weapon', 'sigil_might_t1')).toBe(false) // no weapon equipped
    expect(p.inventory.sigil_might_t1).toBe(1) // not consumed
  })

  it('enforces the socket cap and rejects duplicates', () => {
    const p = freshWarrior()
    p.equipment.weapon = 'test_weapon'
    p.inventory.sigil_might_t1 = 1
    p.inventory.sigil_ward_t1 = 1
    p.inventory.sigil_vigor_t1 = 1
    expect(p.socketEquipmentSigil('weapon', 'sigil_might_t1')).toBe(true)
    expect(p.socketEquipmentSigil('weapon', 'sigil_ward_t1')).toBe(true)
    expect(p.socketEquipmentSigil('weapon', 'sigil_vigor_t1')).toBe(false) // cap 2 reached
    expect(p.socketedSigils.weapon?.length).toBe(2)
    expect(p.inventory.sigil_vigor_t1).toBe(1) // rejected copy stays in the bag
  })

  it('unsocketing returns the sigil to the bag and removes its bonus (reversible)', () => {
    const p = freshWarrior()
    p.equipment.weapon = 'test_weapon'
    p.inventory.sigil_might_t1 = 1
    const atkBefore = p.atk
    p.socketEquipmentSigil('weapon', 'sigil_might_t1')
    expect(p.unsocketEquipmentSigil('weapon', 'sigil_might_t1')).toBe(true)
    expect(p.inventory.sigil_might_t1).toBe(1)
    expect(p.socketedSigils.weapon).toEqual([])
    expect(p.atk).toBe(atkBefore) // bonus gone
  })

  it('a Vigor sigil raises maxHp and hp stays clamped when it is removed', () => {
    const p = freshWarrior()
    p.equipment.armor = 'test_armor'
    p.inventory.sigil_vigor_t1 = 1
    const maxBefore = p.maxHp
    p.socketEquipmentSigil('armor', 'sigil_vigor_t1')
    expect(p.maxHp).toBe(maxBefore + 4) // vigor t1 = +4 hp
    p.hp = p.maxHp
    p.unsocketEquipmentSigil('armor', 'sigil_vigor_t1')
    expect(p.maxHp).toBe(maxBefore)
    expect(p.hp).toBeLessThanOrEqual(p.maxHp) // re-clamped, no overflow
  })
})

describe('player store — World-1 main quest (Inc 4 infra)', () => {
  it('a fresh player starts at the first step (the guildmaster call)', () => {
    const p = freshWarrior()
    expect(p.mainQuest.step).toBe(0)
    expect(p.mainQuestStep?.id).toBe('w1_call_to_adventure')
  })

  it('dispatching a matching event advances the chain and grants its reward exactly once', () => {
    const p = freshWarrior()
    const gold0 = p.gold
    p.dispatchQuestEvent({ type: 'talk-npc', npcId: 'guildmaster' })
    expect(p.mainQuest.step).toBe(1)
    expect(p.gold).toBe(gold0 + WORLD1_MAIN_QUEST[0].reward.gold)
    expect(p.mainQuestStep?.id).toBe('w1_into_the_forest')
  })

  it('ignores an event that does not match the active step', () => {
    const p = freshWarrior()
    p.dispatchQuestEvent({ type: 'defeat-monster' }) // step 0 is talk-npc, not a defeat
    expect(p.mainQuest.step).toBe(0)
    expect(p.gold).toBe(90) // no reward granted
  })

  it('side quests progress on dispatched events and claim exactly once', () => {
    const p = freshWarrior()
    expect(p.acceptSideQuestsFromNpc('blacksmith')).toBeGreaterThan(0)
    expect(p.sideQuests.find((s) => s.quest.id === 'sq_gather_gel')?.accepted).toBe(true)
    // sq_gather_gel = defeat 3 monsters
    for (let i = 0; i < 3; i++) p.dispatchQuestEvent({ type: 'defeat-monster' })
    const gel = p.sideQuests.find((s) => s.quest.id === 'sq_gather_gel')!
    expect(gel.done).toBe(true)
    const gold0 = p.gold
    expect(p.claimSideQuest('sq_gather_gel')).toBe(true)
    expect(p.gold).toBe(gold0 + gel.quest.reward.gold)
    expect(p.claimSideQuest('sq_gather_gel')).toBe(false) // idempotent
  })

  it('will not claim an unfinished side quest', () => {
    const p = freshWarrior()
    expect(p.claimSideQuest('sq_deep_hunt')).toBe(false) // needs 10 defeats
  })

  it('discovering a secret grants its reward once and completes the matching find-secret quest', () => {
    const p = freshWarrior()
    const gold0 = p.gold
    p.acceptSideQuestsFromNpc('portal_guardian')
    expect(p.discoverSecret('w1-main-chest')).toBe(true)
    expect(p.secretsFound).toContain('w1-main-chest')
    expect(p.gold).toBe(gold0 + 80) // w1-main-chest gold reward
    expect(p.inventory.potion_m).toBe(1) // item reward granted
    // the find-secret side quest for this secret is now complete
    const tq = p.sideQuests.find((s) => s.quest.id === 'sq_treasure_hunter')!
    expect(tq.done).toBe(true)
    // re-discovering is a no-op (no double reward)
    expect(p.discoverSecret('w1-main-chest')).toBe(false)
  })
})

describe('player store — save compatibility (pre-Phase-14 blob loads with zero loss)', () => {
  it('backfills the additive Phase-14 fields without touching legacy data, and getters stay safe', () => {
    const p = freshWarrior()
    // simulate a hydrated PRE-Phase-14 save: real legacy progress, but NONE of the new fields exist
    p.level = 7
    p.gold = 350
    p.exp = 42
    p.inventory = { potion_s: 3, slime_gel: 5 }
    p.equipment = { weapon: 'legacy_weapon' }
    ;(p as unknown as Record<string, unknown>).socketedSigils = undefined
    ;(p as unknown as Record<string, unknown>).mainQuest = undefined
    ;(p as unknown as Record<string, unknown>).sideQuestProgress = undefined
    ;(p as unknown as Record<string, unknown>).sideQuestClaimed = undefined
    ;(p as unknown as Record<string, unknown>).secretsFound = undefined

    ;(p as unknown as Record<string, unknown>).sideQuestAccepted = undefined
    ;(p as unknown as Record<string, unknown>).academyLessonsCompleted = undefined
    ensurePlayerDefaults(p) // what afterHydrate runs on load

    // legacy data preserved exactly (zero loss)
    expect(p.level).toBe(7)
    expect(p.gold).toBe(350)
    expect(p.inventory.slime_gel).toBe(5)
    expect(p.equipment.weapon).toBe('legacy_weapon')
    // new fields defaulted sanely
    expect(p.socketedSigils).toEqual({})
    expect(p.mainQuest).toEqual({ step: 0, progress: 0 })
    expect(p.sideQuestProgress).toEqual({})
    expect(p.secretsFound).toEqual([])
    // and every Phase-14 getter is safe (no crash reading a defaulted field)
    expect(p.sideQuestAccepted).toEqual([])
    expect(p.academyLessonsCompleted).toEqual([])
    expect(p.mainQuestStep?.id).toBe('w1_call_to_adventure')
    expect(p.sideQuests.length).toBeGreaterThan(0)
    expect(typeof p.stats.atk).toBe('number')
  })

  it('is idempotent — a second load never clobbers existing progress', () => {
    const p = freshWarrior()
    p.dispatchQuestEvent({ type: 'talk-npc', npcId: 'guildmaster' }) // advance main quest to step 1
    p.socketedSigils = { weapon: ['sigil_might_t1'] }
    ensurePlayerDefaults(p)
    ensurePlayerDefaults(p)
    expect(p.mainQuest.step).toBe(1)                       // not reset to 0
    expect(p.socketedSigils.weapon).toEqual(['sigil_might_t1']) // preserved
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
describe('player store - World-1 location authority', () => {
  it('keeps the highest Adventure Rank while travelling backward', () => {
    const p = freshWarrior()
    p.enterAdventureZone('mosswood-trail')
    expect(p.currentFloor).toBe(5)
    expect(p.adventureRank).toBe(5)

    p.enterAdventureZone('whisperleaf-meadow')
    expect(p.currentFloor).toBe(1)
    expect(p.currentZoneId).toBe('whisperleaf-meadow')
    expect(p.adventureRank).toBe(5)
  })

  it('records a region clear once without duplicating completion state', () => {
    const p = freshWarrior()
    expect(p.completeAdventureRegion('verdant-frontier')).toBe(true)
    expect(p.completeAdventureRegion('verdant-frontier')).toBe(false)
    expect(p.completedRegionIds).toEqual(['verdant-frontier'])
    expect(p.world1Completed).toBe(true)
    expect(p.regionReputation['verdant-frontier']).toBe(100)
  })
})
