import { describe, expect, it } from 'vitest'
import { grantJobExp, grantMastery, jobExpToNext, masteryDamageBonus, weaponMasteryFamily } from '~/data/mmorpgProgression'

describe('long-term job and weapon progression', () => {
  it('levels jobs and awards an extra point at each fifth job level', () => {
    const result = grantJobExp(4, 0, jobExpToNext(4))
    expect(result.level).toBe(5)
    expect(result.skillPoints).toBe(2)
  })

  it('maps the equipment catalog into readable mastery families', () => {
    expect(weaponMasteryFamily('longsword')).toBe('blade')
    expect(weaponMasteryFamily('bow')).toBe('ranged')
    expect(weaponMasteryFamily('staff')).toBe('arcane')
    expect(weaponMasteryFamily('mace')).toBe('divine')
  })

  it('caps mastery and its combat bonus', () => {
    const mastery = grantMastery({ level: 19, exp: 0 }, 10_000)
    expect(mastery).toEqual({ level: 20, exp: 0 })
    expect(masteryDamageBonus(20)).toBeLessThanOrEqual(0.12)
  })
})
