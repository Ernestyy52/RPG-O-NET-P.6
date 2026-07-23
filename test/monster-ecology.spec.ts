import { describe, expect, it } from 'vitest'
import { codexTier, elementMultiplier, monsterEcology } from '~/data/monsterEcology'

describe('monster ecology', () => {
  it('assigns readable strengths, weaknesses, behavior, and signature drops', () => {
    const mushroom = monsterEcology('mushroom_monster')
    expect(mushroom.element).toBe('earth')
    expect(mushroom.weakness).toBe('fire')
    expect(mushroom.passive).toContain('Spores')
    expect(mushroom.intents.length).toBeGreaterThanOrEqual(2)
    expect(mushroom.signatureDrop).toBeTruthy()
  })

  it('provides safe profiles for the full legacy monster catalog', () => {
    const inferred = monsterEcology('ice_robot')
    expect(inferred.element).toBe('water')
    expect(inferred.family).toBe('construct')
    expect(inferred.weakness).toBe('wind')
  })

  it('uses a restrained element advantage and codex milestones', () => {
    expect(elementMultiplier('fire', 'earth')).toBe(1.25)
    expect(elementMultiplier('earth', 'earth')).toBe(0.75)
    expect(codexTier(0)).toBe(0)
    expect(codexTier(50)).toBe(4)
  })
})
