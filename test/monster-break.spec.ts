import { describe, expect, it } from 'vitest'
import { applyBreakDamage, gradeAnswer, monsterBreakProfile } from '~/data/combat/monsterBreak'

describe('monster Break combat', () => {
  it('rewards fast accurate answers with more poise damage', () => {
    expect(gradeAnswer(true, 3000)).toEqual({ grade: 'perfect', breakDamage: 3, label: 'PERFECT' })
    expect(gradeAnswer(true, 7000).breakDamage).toBe(2)
    expect(gradeAnswer(true, 12000).breakDamage).toBe(1)
    expect(gradeAnswer(false, 1000).breakDamage).toBe(0)
  })

  it('signals a break exactly when poise reaches zero', () => {
    expect(applyBreakDamage(2, 3)).toEqual({ remaining: 0, broken: true })
    expect(applyBreakDamage(0, 2)).toEqual({ remaining: 0, broken: false })
  })

  it('gives bosses a longer, tougher break cycle', () => {
    const normal = monsterBreakProfile('slime')
    const boss = monsterBreakProfile('myco_colossus', true)
    expect(boss.max).toBeGreaterThan(normal.max)
    expect(boss.stunMs).toBeGreaterThan(normal.stunMs)
  })
})
