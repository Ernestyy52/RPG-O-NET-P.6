import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { HERO_CLASSES } from '~/data/classes'
import { WORLD1_MAIN_QUEST, isMainQuestComplete, type QuestEvent } from '~/data/world1/quests'
import { WORLD1_HANDOFF_CONTRACT } from '~/data/world1/completion'
import { getBossStats, getFloorConfig } from '~/data/floors'
import { getDungeonLayout } from '~/game/runtime/dungeonLayouts'
import { usePlayerStore } from '~/stores/player'

beforeEach(() => setActivePinia(createPinia()))

const REQUIRED_ROUTE: QuestEvent[] = [
  { type: 'talk-npc', npcId: 'guildmaster' },
  { type: 'reach-zone', zoneId: 'whisperleaf-meadow' },
  { type: 'defeat-monster' },
  { type: 'defeat-monster' },
  { type: 'defeat-monster' },
  { type: 'answer-correct' },
  { type: 'answer-correct' },
  { type: 'answer-correct' },
  { type: 'answer-correct' },
  { type: 'answer-correct' },
  { type: 'reach-zone', zoneId: 'mosswood-trail' },
  { type: 'enter-dungeon', layoutId: 'world01-mini' },
  { type: 'clear-dungeon', layoutId: 'world01-mini' },
  { type: 'talk-npc', npcId: 'portal_guardian' },
  { type: 'reach-zone', zoneId: 'deepgrove' },
  { type: 'enter-dungeon', layoutId: 'world01-main' },
  { type: 'clear-dungeon', layoutId: 'world01-main' },
  { type: 'defeat-boss', bossId: 'myco_colossus' },
]
function grantMandatoryRouteCombat(player: ReturnType<typeof usePlayerStore>, event: QuestEvent) {
  if (event.type === 'defeat-monster') {
    const encounter = getFloorConfig(1)
    player.gainCombatRewards(encounter.expReward, encounter.goldReward)
    return
  }
  if (event.type === 'clear-dungeon') {
    const layout = getDungeonLayout(event.layoutId)
    const encounters = layout.spawns.reduce((total, spawn) => total + spawn.count, 0) + layout.elites.length
    const encounter = getFloorConfig(event.layoutId === 'world01-mini' ? 6 : 10)
    player.gainCombatRewards(encounter.expReward * encounters, encounter.goldReward * encounters)
    return
  }
  if (event.type === 'defeat-boss') {
    const boss = getBossStats(10)
    player.gainCombatRewards(boss.expReward, boss.goldReward, 1)
  }
}


describe('World 1 release gate', () => {
  for (const heroClass of HERO_CLASSES) {
    it(`${heroClass.name} can complete the deterministic route and receive the handoff once`, () => {
      setActivePinia(createPinia())
      const player = usePlayerStore()
      player.createCharacter({ name: heroClass.name, gender: 'male', classId: heroClass.id, face: 'calm', hair: 'short', color: 'amber' })

      player.enterAdventureZone('whisperleaf-meadow')
      for (const event of REQUIRED_ROUTE) {
        if (event.type === 'reach-zone') player.enterAdventureZone(event.zoneId)
        if (event.type === 'enter-dungeon' && event.layoutId === 'world01-main') player.enterAdventureZone('myco-sanctum')
        grantMandatoryRouteCombat(player, event)
        player.dispatchQuestEvent(event)
      }

      expect(isMainQuestComplete(player.mainQuest)).toBe(true)
      expect(player.mainQuest.step).toBe(WORLD1_MAIN_QUEST.length)

      const before = { exp: player.exp, gold: player.gold, gems: player.gems }
      expect(player.completeAdventureRegion('verdant-frontier')).toBe(true)
      expect(player.level).toBeGreaterThanOrEqual(WORLD1_HANDOFF_CONTRACT.acceptableLevelBand.min)
      expect(player.level).toBeLessThanOrEqual(WORLD1_HANDOFF_CONTRACT.acceptableLevelBand.max)
      expect(player.world1Completed).toBe(true)
      expect(player.adventureRank).toBe(WORLD1_HANDOFF_CONTRACT.completionRank)
      expect(player.claimedRegionRewardIds).toEqual(['verdant-frontier'])
      expect(player.inventory.set_verdant_trinket).toBe(1)
      expect(player.inventory.potion_m).toBe(2)
      expect(player.gold).toBe(before.gold + WORLD1_HANDOFF_CONTRACT.reward.gold)
      expect(player.gems).toBe(before.gems + WORLD1_HANDOFF_CONTRACT.reward.gems)
      expect(player.exp !== before.exp || player.level > 1).toBe(true)

      const after = { level: player.level, exp: player.exp, gold: player.gold, gems: player.gems, relics: player.inventory.set_verdant_trinket }
      expect(player.completeAdventureRegion('verdant-frontier')).toBe(false)
      expect({ level: player.level, exp: player.exp, gold: player.gold, gems: player.gems, relics: player.inventory.set_verdant_trinket }).toEqual(after)
    })
  }

  it('upgrades a pre-reward completed save exactly once', () => {
    const player = usePlayerStore()
    player.createCharacter({ name: 'Returning', gender: 'female', classId: 'mage', face: 'calm', hair: 'long', color: 'teal' })
    player.completedRegionIds = ['verdant-frontier']
    player.claimedRegionRewardIds = []
    player.adventureRank = 8

    expect(player.completeAdventureRegion('verdant-frontier')).toBe(true)
    expect(player.completedRegionIds).toEqual(['verdant-frontier'])
    expect(player.claimedRegionRewardIds).toEqual(['verdant-frontier'])
    expect(player.adventureRank).toBe(10)
    expect(player.completeAdventureRegion('verdant-frontier')).toBe(false)
  })
})
