import { describe, expect, it } from 'vitest'
import { HERO_CLASSES } from '../app/data/classes'
import {
  OCCUPATIONS, OCCUPATION_EQUIPMENT, gearAllowedForClass,
  signatureGearForJob, starterEquipmentForClass,
} from '../app/data/occupations'
import { JOBS } from '../app/data/combat/skillDefs'

describe('occupation fantasy and gear', () => {
  it('gives every playable class an identity, starter set, portrait and actual signature skills', async () => {
    const { ALL_SKILL_DEFS } = await import('../app/data/combat/skillDefs')
    const skillIds = new Set(ALL_SKILL_DEFS.map((skill) => skill.id))
    for (const hero of HERO_CLASSES) {
      const occupation = OCCUPATIONS[hero.id]
      expect(occupation.portrait).toMatch(/^class-jobs\/.+\.webp$/)
      expect(Object.values(starterEquipmentForClass(hero.id))).toHaveLength(3)
      expect(occupation.signatureSkills.every((id) => skillIds.has(id))).toBe(true)
    }
  })

  it('adds three starter items per class and one restricted signature weapon per advanced job', () => {
    expect(OCCUPATION_EQUIPMENT.filter((item) => !item.advancedJobId)).toHaveLength(HERO_CLASSES.length * 3)
    for (const job of JOBS) {
      const gear = signatureGearForJob(job.id)
      expect(gear).toBeDefined()
      expect(gearAllowedForClass(gear!, job.classId, job.id)).toBe(true)
      expect(gearAllowedForClass(gear!, job.classId)).toBe(false)
    }
  })
})
