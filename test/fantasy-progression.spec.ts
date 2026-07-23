import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { STARTING_SKILL_POINTS, skillPointsGrantedAtLevel, skillPointsSpent } from '~/data/skills'
import { usePlayerStore } from '~/stores/player'

beforeEach(() => setActivePinia(createPinia()))

function hero() {
  const player = usePlayerStore()
  player.createCharacter({ name: 'Paper Doll', gender: 'female', classId: 'warrior', face: 'calm', hair: 'long', color: 'amber' })
  return player
}

describe('fantasy progression — skill points', () => {
  it('starts with enough points to make an immediate build choice', () => {
    expect(hero().skillPoints).toBe(STARTING_SKILL_POINTS)
    expect(STARTING_SKILL_POINTS).toBeGreaterThanOrEqual(3)
  })

  it('grants a milestone bonus every five levels', () => {
    expect(skillPointsGrantedAtLevel(2)).toBe(1)
    expect(skillPointsGrantedAtLevel(5)).toBe(2)
    expect(skillPointsGrantedAtLevel(10)).toBe(2)
  })

  it('upgrades stats, then refunds the exact spend on a free reset', () => {
    const player = hero()
    const attackBefore = player.atk
    expect(player.learnSkill('warrior_attack_1')).toBe(true)
    expect(player.atk).toBe(attackBefore + 4)
    expect(player.skillPoints).toBe(STARTING_SKILL_POINTS - 1)
    expect(skillPointsSpent(player.learnedSkills)).toBe(1)

    expect(player.resetSkillTree()).toBe(1)
    expect(player.skillPoints).toBe(STARTING_SKILL_POINTS)
    expect(player.atk).toBe(attackBefore)
    expect(player.learnedSkills).toEqual([])
  })

  it('never applies talents from a different class to the active class', () => {
    const player = hero()
    player.learnedSkills = ['mage_attack_1']
    expect(player.atk).toBe(10)
    expect(player.stats.mag).toBe(1)
  })
})
