import { describe, expect, it } from 'vitest'
import { huntQualifies, rollHuntingBoard } from '~/data/huntingBoard'

describe('regional hunting board', () => {
  it('rolls three deterministic contracts with escalating target rules', () => {
    const first = rollHuntingBoard('2026-07-23', 'verdant-frontier', 8)
    const second = rollHuntingBoard('2026-07-23', 'verdant-frontier', 8)
    expect(first).toEqual(second)
    expect(first.map((contract) => contract.difficulty)).toEqual(['standard', 'elite', 'rare'])
    expect(first.every((contract) => contract.reward.exp > 0 && contract.reward.gold > 0)).toBe(true)
  })

  it('only advances elite and rare contracts for matching variants', () => {
    const contracts = rollHuntingBoard('2026-07-23', 'verdant-frontier', 8)
    const elite = contracts[1]!
    const rare = contracts[2]!
    expect(huntQualifies(elite, elite.targetMonsterId, false, false)).toBe(false)
    expect(huntQualifies(elite, elite.targetMonsterId, true, false)).toBe(true)
    expect(huntQualifies(rare, rare.targetMonsterId, false, true)).toBe(true)
  })
})
