import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { ALL_SKILL_DEFS, JOBS, validateSkillDefs, skillsForClass, jobsForClass } from '~/data/combat/skillDefs'
import { validateBuilds, BUILDS, buildsForClass } from '~/data/combat/builds'

describe('skill definitions (Phase 4 data rules)', () => {
  it('validateSkillDefs passes — 6A/3P/1U per class, 4A/2P per job, learning gate on every damage skill', () => {
    expect(validateSkillDefs()).toEqual([])
    expect(ALL_SKILL_DEFS).toHaveLength(88) // 4×10 base + 8×6 job
    expect(JOBS).toHaveLength(8)
  })

  it('every icon key resolves to a real file in public/skill-icons/', () => {
    for (const s of ALL_SKILL_DEFS) {
      const file = fileURLToPath(new URL(`../public/skill-icons/${s.iconKey}.png`, import.meta.url))
      expect(existsSync(file), `${s.id} → ${s.iconKey}.png`).toBe(true)
    }
  })

  it('skillsForClass excludes other jobs but includes the chosen one', () => {
    const base = skillsForClass('warrior')
    expect(base.every((s) => !s.jobId)).toBe(true)
    const withJob = skillsForClass('warrior', 'berserker')
    expect(withJob.some((s) => s.jobId === 'berserker')).toBe(true)
    expect(withJob.some((s) => s.jobId === 'warmaster')).toBe(false)
    expect(jobsForClass('warrior').map((j) => j.id)).toEqual(['berserker', 'warmaster'])
  })

  it('every class has at least one data-driven combo (apply → consume of the same status)', () => {
    for (const classId of ['warrior', 'mage', 'archer', 'guardian'] as const) {
      const skills = skillsForClass(classId)
      const applied = new Set(skills.flatMap((s) => s.applies ?? []))
      const consumed = skills.flatMap((s) => s.consumes ?? [])
      expect(consumed.some((c) => applied.has(c)), classId).toBe(true)
    }
  })

  it('all 12 preset builds validate against loadout rules', () => {
    expect(validateBuilds()).toEqual([])
    expect(BUILDS).toHaveLength(12)
    for (const classId of ['warrior', 'mage', 'archer', 'guardian'] as const) {
      expect(buildsForClass(classId).length).toBeGreaterThanOrEqual(3)
    }
  })
})
