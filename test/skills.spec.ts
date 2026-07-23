import { describe, it, expect } from 'vitest'
import { SKILL_TREE, skillsForClass, canLearnSkill, type SkillNode } from '~/data/skills'
import { HERO_CLASSES } from '~/data/classes'

describe('skills — tree integrity', () => {
  it('has 4 classes × 3 branches × 4 ranks = 48 skills with unique ids', () => {
    expect(SKILL_TREE.length).toBe(48)
    const ids = SKILL_TREE.map((s) => s.id)
    expect(new Set(ids).size).toBe(48)
  })

  it('ids follow the `${classId}_${branch}_${rank}` convention and cost === rank', () => {
    for (const s of SKILL_TREE) {
      expect(s.id).toBe(`${s.classId}_${s.branch}_${s.rank}`)
      expect(s.cost).toBe(s.rank)
    }
  })

  it('every class has exactly 12 skills', () => {
    for (const c of HERO_CLASSES) {
      expect(skillsForClass(c.id).length).toBe(12)
    }
  })
})

describe('skills — learn prerequisites', () => {
  const rank = (classId: string, branch: string, r: number) =>
    SKILL_TREE.find((s) => s.id === `${classId}_${branch}_${r}`) as SkillNode

  it('rank 1 is learnable with enough points; rank 2 requires rank 1 first', () => {
    const r1 = rank('warrior', 'attack', 1)
    const r2 = rank('warrior', 'attack', 2)
    expect(canLearnSkill(r1, [], 5)).toBe(true)
    expect(canLearnSkill(r2, [], 5)).toBe(false) // missing prerequisite r1
    expect(canLearnSkill(r2, [r1.id], 5)).toBe(true)
  })

  it('rejects a skill already learned', () => {
    const r1 = rank('mage', 'knowledge', 1)
    expect(canLearnSkill(r1, [r1.id], 5)).toBe(false)
  })

  it('rejects when skill points are insufficient', () => {
    const r4 = rank('guardian', 'defense', 4) // cost 4
    const learned = ['guardian_defense_1', 'guardian_defense_2', 'guardian_defense_3']
    expect(canLearnSkill(r4, learned, 3)).toBe(false) // needs 4 points
    expect(canLearnSkill(r4, learned, 4)).toBe(true)
  })

  it('prerequisite is branch- and class-specific (cannot cross branches)', () => {
    const warAtk2 = rank('warrior', 'attack', 2)
    // learning warrior DEFENSE rank1 does not unlock warrior ATTACK rank2
    expect(canLearnSkill(warAtk2, ['warrior_defense_1'], 5)).toBe(false)
  })
})
